import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';

export function ContactModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => { dialog.current!.showModal(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setStatus('sending');
    try {
      const response = await fetch('https://contact.dinatih.org/api/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, subject: 'Contact depuis le CV — Appartement 3D' }),
      });
      if (!response.ok) throw new Error(`Contact : HTTP ${response.status}`);
      setStatus('sent');
    } catch (error) {
      console.error('Échec de l’envoi du formulaire de contact', error);
      setStatus('error');
    }
  }

  return createPortal(
    <dialog ref={dialog} className="col-11 col-sm-8 col-md-6 col-lg-4 p-0 border-0 rounded shadow bg-body text-body"
      aria-labelledby="contact-title" onClose={onClose}
      onKeyDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
      <div className="modal-header p-3 border-bottom">
        <h5 id="contact-title" className="modal-title fs-6">Me contacter</h5>
        <button type="button" className="btn-close" aria-label="Fermer" onClick={onClose} />
      </div>
      <form onSubmit={submit} className="p-3">
        {status === 'sent' ? <p role="status" className="alert alert-success mb-0">Votre message a été envoyé. Merci !</p> : <>
          <fieldset disabled={status === 'sending'} className="d-flex flex-column gap-2">
            <label htmlFor="contact-name" className="form-label mb-0">Nom</label>
            <input id="contact-name" name="name" autoComplete="name" className="form-control form-control-sm" maxLength={50} required autoFocus />
            <label htmlFor="contact-email" className="form-label mb-0">Adresse e-mail</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" className="form-control form-control-sm" required />
            <label htmlFor="contact-message" className="form-label mb-0">Message</label>
            <textarea id="contact-message" name="message" className="form-control form-control-sm" rows={5} maxLength={1000} required />
            <div className="d-none" aria-hidden="true">
              <label htmlFor="contact-honeypot">Laisser ce champ vide</label>
              <input id="contact-honeypot" name="honeypot" tabIndex={-1} autoComplete="off" />
            </div>
            <p className="small text-body-secondary mb-0">Votre adresse e-mail servira uniquement à vous répondre.</p>
            <button type="submit" className="btn btn-primary btn-sm">{status === 'sending' ? 'Envoi en cours…' : 'Envoyer'}</button>
          </fieldset>
          {status === 'error' && <p role="alert" className="alert alert-danger small mt-3 mb-0">L’envoi a échoué. Veuillez réessayer.</p>}
        </>}
      </form>
    </dialog>, document.body,
  );
}
