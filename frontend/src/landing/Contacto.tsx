import React, { useState } from 'react';
import { Mail, Check, Copy, Send } from 'lucide-react';
import contactIllustration from '../assets/contact-illustration.png';
import './contacto.css';

export default function Contacto() {
  const [copied, setCopied] = useState(false);
  const email = 'pymeserp.oficial@gmail.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contacto" className="lp-contact-section">
      <div className="lp-contact-container">
        
        {/* Columna Izquierda: Ilustración Monocromática */}
        <div className="lp-contact-image-wrapper">
          <img 
            src={contactIllustration} 
            alt="Ilustración de contacto por correo" 
            className="lp-contact-img"
          />
        </div>

        {/* Columna Derecha: Tarjeta de Contacto y Formulario */}
        <div className="lp-contact-card">
          <div className="lp-contact-badge">
            <Mail size={14} />
            <span>Contacto directo</span>
          </div>

          <h2 className="lp-contact-title">
            ¿Tienes dudas o quieres solicitar una demo?
          </h2>
          <p className="lp-contact-subtitle">
            Escríbenos directamente o déjanos un mensaje. Te ayudamos a configurar tu negocio sin ningún compromiso.
          </p>

          {/* Bloque para copiar Email rápido */}
          <div className="lp-email-box">
            <span className="lp-email-address">{email}</span>
            <button 
              type="button" 
              className={`lp-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={16} /> Copiado
                </>
              ) : (
                <>
                  <Copy size={16} /> Copiar
                </>
              )}
            </button>
          </div>

          {/* Formulario de Mensaje Ligero */}
          <form className="lp-contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="lp-form-row">
              <input 
                type="text" 
                placeholder="Nombre o Negocio" 
                className="lp-input"
                required 
              />
              <input 
                type="email" 
                placeholder="Tu correo electrónico" 
                className="lp-input"
                required 
              />
            </div>
            
            <textarea 
              placeholder="¿En qué te podemos ayudar?" 
              rows={3} 
              className="lp-input lp-textarea"
              required
            ></textarea>

            <button type="submit" className="lp-submit-btn">
              <span>Enviar mensaje</span>
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}