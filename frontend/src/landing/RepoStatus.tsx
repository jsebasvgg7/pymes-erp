import { useEffect, useRef, useState } from "react";
import "./repo-status.css";

const REPO = "jsebasvgg7/pymes-erp";
const API_BASE = `https://api.github.com/repos/${REPO}`;

interface LangBar {
  name: string;
  percent: number;
}

interface RepoStats {
  commits: number;
  languages: LangBar[];
  updatedAt: string;
  contributors: number;
}

const FALLBACK: RepoStats = {
  commits: 0,
  languages: [],
  updatedAt: "",
  contributors: 4,
};

function tiempoRelativo(iso: string): string {
  if (!iso) return "—";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "hace 1 día";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
}

async function fetchRepoStats(): Promise<RepoStats> {
  const [repoRes, langRes, commitsRes, contribRes] = await Promise.all([
    fetch(API_BASE),
    fetch(`${API_BASE}/languages`),
    fetch(`${API_BASE}/commits?per_page=1`),
    fetch(`${API_BASE}/contributors?per_page=100&anon=true`),
  ]);

  if (!repoRes.ok) throw new Error("repo fetch failed");

  const repoJson = await repoRes.json();
  const langJson: Record<string, number> = langRes.ok ? await langRes.json() : {};

  const totalBytes = Object.values(langJson).reduce((a, b) => a + b, 0);
  const languages: LangBar[] = Object.entries(langJson)
    .map(([name, bytes]) => ({
      name,
      percent: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  let commits = 0;
  const linkHeader = commitsRes.headers.get("link");
  if (linkHeader) {
    const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
    if (match) commits = parseInt(match[1], 10);
  }
  if (!commits && commitsRes.ok) {
    const commitsJson = await commitsRes.json();
    commits = Array.isArray(commitsJson) ? commitsJson.length : 0;
  }

  let contributors = FALLBACK.contributors;
  if (contribRes.ok) {
    const contribJson = await contribRes.json();
    if (Array.isArray(contribJson) && contribJson.length > 0) {
      contributors = contribJson.length;
    }
  }

  return {
    commits,
    languages,
    updatedAt: repoJson.pushed_at || repoJson.updated_at || "",
    contributors,
  };
}

export default function RepoStatus() {
  const seccionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");

  useEffect(() => {
    const el = seccionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelado = false;
    fetchRepoStats()
      .then((data) => {
        if (!cancelado) {
          setStats(data);
          setEstado("listo");
        }
      })
      .catch(() => {
        if (!cancelado) {
          setStats(FALLBACK);
          setEstado("error");
        }
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const cargando = estado === "cargando";
  const data = stats ?? FALLBACK;

  return (
    <section
      id="repo-status"
      ref={seccionRef}
      className={`lp-repostatus${visible ? " lp-repostatus--visible" : ""}`}
      aria-labelledby="lp-repostatus-title"
    >
      <div className="lp-wrap">
        <h2 id="lp-repostatus-title" className="lp-repostatus__sr-title">
          Estado del repositorio
        </h2>

        <div className="lp-repostatus__window">
          <div className="lp-repostatus__titlebar">
            <div className="lp-repostatus__dots" aria-hidden="true">
              <span className="lp-repostatus__dot lp-repostatus__dot--red" />
              <span className="lp-repostatus__dot lp-repostatus__dot--yellow" />
              <span className="lp-repostatus__dot lp-repostatus__dot--green" />
            </div>
            <a
              href={`https://github.com/${REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-repostatus__path"
            >
              {REPO}
            </a>
          </div>

          <div className="lp-repostatus__body">
            <div className="lp-repostatus__stat">
              <span className="lp-repostatus__label">$ commits --count</span>
              <span className="lp-repostatus__value">
                {cargando ? "···" : data.commits.toLocaleString("es-CO")}
              </span>
            </div>

            <div className="lp-repostatus__stat lp-repostatus__stat--languages">
              <span className="lp-repostatus__label">$ repo --languages</span>
              {cargando || data.languages.length === 0 ? (
                <span className="lp-repostatus__value">···</span>
              ) : (
                <>
                  <div className="lp-repostatus__langbar">
                    {data.languages.map((lang) => (
                      <span
                        key={lang.name}
                        className="lp-repostatus__langsegment"
                        style={{ width: `${lang.percent}%` }}
                        title={`${lang.name} ${lang.percent}%`}
                      />
                    ))}
                  </div>
                  <span className="lp-repostatus__langlegend">
                    {data.languages.map((l) => `${l.name} ${l.percent}%`).join(" · ")}
                  </span>
                </>
              )}
            </div>

            <div className="lp-repostatus__stat">
              <span className="lp-repostatus__label">$ git log -1 --date=relative</span>
              <span className="lp-repostatus__value">
                {cargando ? "···" : tiempoRelativo(data.updatedAt) || "—"}
              </span>
            </div>

            <div className="lp-repostatus__stat">
              <span className="lp-repostatus__label">$ contributors --count</span>
              <span className="lp-repostatus__value">
                {cargando ? "···" : data.contributors}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
