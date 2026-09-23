import React, { useState } from 'react';
import { Mail, Check, Copy, Send, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import contactIllustration from '../assets/contact-illustration.png';
import './contacto.css';

// Credenciales de EmailJS (panel > Email Services / Email Templates / Account > General)
const EMAILJS_SERVICE_ID = 'service_o1oyd2c';
const EMAILJS_TEMPLATE_ID = 'template_vizij22';
const EMAILJS_PUBLIC_KEY = 'GaJwPU1YpAbBMz9jw';

type EstadoEnvio = 'idle' | 'enviando' | 'exito' | 'error';

export default function Contacto() {
  const [copied, setCopied] = useState(false);
  const [estado, setEstado] = useState<EstadoEnvio>('idle');
  const email = 'pymeserp.oficial@gmail.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEstado('enviando');

    const form = e.currentTarget;

    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        form,
        EMAILJS_PUBLIC_KEY
      );
      setEstado('exito');
      form.reset();
      setTimeout(() => setEstado('idle'), 4000);
    } catch (error) {
      setEstado('error');
      setTimeout(() => setEstado('idle'), 4000);
    }
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
            ¿Tienes dudas o quieres solicitar una cuenta?
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
          <form className="lp-contact-form" onSubmit={handleSubmit}>
            <div className="lp-form-row">
              <input 
                type="text" 
                name="nombre"
                placeholder="Nombre o Negocio" 
                className="lp-input"
                required 
              />
              <input 
                type="email" 
                name="email"
                placeholder="Tu correo electrónico" 
                className="lp-input"
                required 
              />
            </div>
            
            <textarea 
              name="mensaje"
              placeholder="¿En qué te podemos ayudar?" 
              rows={3} 
              className="lp-input lp-textarea"
              required
            ></textarea>

            <button
              type="submit"
              className={`lp-submit-btn ${estado === 'exito' ? 'lp-submit-success' : ''} ${estado === 'error' ? 'lp-submit-error' : ''}`}
              disabled={estado === 'enviando'}
            >
              {estado === 'enviando' && (
                <>
                  <span>Enviando</span>
                  <Loader2 size={16} className="lp-spin" />
                </>
              )}
              {estado === 'exito' && (
                <>
                  <span>Mensaje enviado</span>
                  <Check size={16} />
                </>
              )}
              {estado === 'error' && (
                <>
                  <span>Error, intenta de nuevo</span>
                  <Send size={16} />
                </>
              )}
              {estado === 'idle' && (
                <>
                  <span>Enviar mensaje</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}