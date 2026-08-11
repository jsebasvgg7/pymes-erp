import { useId } from "react";
import PrimaryButton from "../components/PrimaryButton";
import "./LoginPage.css";

export default function LoginPage() {
	const emailId = useId();
	const passwordId = useId();

	return (
		<div className="login">
			<section className="login__left" aria-hidden="true">
				<div className="login__leftInner">
					<div className="login__shapes">
						<div className="login__shape login__shape--circle" />
						<div className="login__shape login__shape--square" />
						<div className="login__shape login__shape--ring" />
					</div>
					<div className="login__welcome">
						<h2 className="login__welcomeTitle">Bienvenido</h2>
						<p className="login__welcomeText">
							Accede a tu ERP contable con una experiencia segura, clara y enfocada en tu negocio.
						</p>
					</div>
				</div>
			</section>

			<section className="login__right">
				<div className="login__card" role="region" aria-label="Formulario de inicio de sesión">
					<div className="login__brand">
						<div className="login__logo" aria-hidden="true">
							<svg viewBox="0 0 48 48" width="28" height="28" focusable="false" aria-hidden="true">
								<path
									d="M10 34V14a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4Z"
									fill="currentColor"
									opacity="0.12"
								/>
								<path
									d="M16 30h16M16 24h16M16 18h10"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
								/>
							</svg>
						</div>
						<div className="login__brandText">
							<h1 className="login__title">Contabilidad PYMES</h1>
							<p className="login__subtitle">Inicia sesión para continuar</p>
						</div>
					</div>

					<form
						className="login__form"
						action="#"
						method="post"
						onSubmit={(e) => e.preventDefault()}
					>
						<div className="login__field">
							<label className="login__label" htmlFor={emailId}>
								Correo electrónico
							</label>
							<input
								className="login__input"
								id={emailId}
								name="email"
								type="email"
								placeholder="tu@empresa.com"
								autoComplete="email"
								required
							/>
						</div>

						<div className="login__field">
							<label className="login__label" htmlFor={passwordId}>
								Contraseña
							</label>
							<div className="login__password">
								<input
									className="login__input login__input--password"
									id={passwordId}
									name="password"
									type="password"
									placeholder="••••••••"
									autoComplete="current-password"
									required
								/>
								<button className="login__toggle" type="button" aria-label="Mostrar u ocultar contraseña">
									<svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true">
										<path
											d="M12 5c5.5 0 9.5 4.2 10.6 6-.1.2-.3.6-.6 1-1.4 2.1-4.9 7-10 7S3.4 14.1 2 12c-.3-.4-.5-.8-.6-1C2.5 9.2 6.5 5 12 5Zm0 3.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
											fill="currentColor"
											opacity="0.22"
										/>
										<path
											d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z"
											fill="currentColor"
										/>
									</svg>
								</button>
							</div>
						</div>

						<div className="login__row">
							<label className="login__remember">
								<input className="login__checkbox" type="checkbox" name="remember" />
								<span>Recordarme</span>
							</label>
						</div>

						<PrimaryButton className="login__submit" type="submit">
							Iniciar sesión
						</PrimaryButton>

						<button className="login__link" type="button">
							¿Olvidaste tu contraseña?
						</button>
					</form>
				</div>
			</section>
		</div>
	);
}
