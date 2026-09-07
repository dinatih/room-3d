import { useState } from 'react';

export type CvType = 'devops' | 'admin';

interface CvModalProps {
  initialCv?: CvType;
  onClose: () => void;
}

export function CvModal({ initialCv = 'devops', onClose }: CvModalProps) {
  const [activeCv, setActiveCv] = useState<CvType>(initialCv);

  const cvFiles = {
    devops: {
      title: 'Ingénieur DevOps',
      pdf: '/cv-ingenieur-devops.pdf',
      badge: 'DevOps / Cloud / SRE',
    },
    admin: {
      title: 'Administrateur Systèmes',
      pdf: '/cv-administrateur-systemes.pdf',
      badge: 'Linux / SysAdmin / Infra',
    },
  };

  const current = cvFiles[activeCv];

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1100 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-xl"
        style={{ maxWidth: '950px', height: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content text-dark glass-card shadow-lg d-flex flex-column h-100 border-0" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
          {/* Header */}
          <div className="modal-header border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <span className="fs-5">📄</span>
              <div>
                <h5 className="modal-title fs-6 fw-bold mb-0">Curriculum Vitae — David Herelle</h5>
                <small className="text-muted" style={{ fontSize: '11px' }}>
                  {current.title} · <span className="badge bg-danger bg-opacity-75">{current.badge}</span>
                </small>
              </div>
            </div>

            {/* Onglets de sélection de CV */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn btn-sm ${activeCv === 'devops' ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setActiveCv('devops')}
                style={{ fontSize: '12px' }}
              >
                🛠️ CV Ingénieur DevOps
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeCv === 'admin' ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setActiveCv('admin')}
                style={{ fontSize: '12px' }}
              >
                🐧 CV Admin Systèmes
              </button>
            </div>

            <div className="d-flex align-items-center gap-2">
              <a
                href={current.pdf}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
                style={{ fontSize: '11px' }}
                title="Ouvrir dans un nouvel onglet"
              >
                <span>↗️</span> Plein écran
              </a>
              <a
                href={current.pdf}
                download
                className="btn btn-sm btn-outline-success py-1 px-2 d-flex align-items-center gap-1"
                style={{ fontSize: '11px' }}
                title="Télécharger le PDF"
              >
                <span>⬇️</span> PDF
              </a>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              />
            </div>
          </div>

          {/* Modal Body: PDF Iframe Viewer */}
          <div className="modal-body p-0 flex-grow-1 bg-dark bg-opacity-10 position-relative">
            <iframe
              src={`${current.pdf}#view=FitH`}
              title={`CV ${current.title}`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </div>

          {/* Footer */}
          <div className="modal-footer border-top py-1 px-3 d-flex justify-content-between align-items-center">
            <div className="text-muted" style={{ fontSize: '11px' }}>
              📍 Paris 13ème (Station F / BNF) · Disponible immédiatement · Hybride / Présentiel
            </div>
            <button type="button" className="btn btn-secondary btn-sm py-1 px-3" onClick={onClose} style={{ fontSize: '12px' }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
