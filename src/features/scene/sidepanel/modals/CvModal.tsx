import { useState, useEffect } from 'react';

export type CvType = 'devops' | 'admin';

interface CvModalProps {
  initialCv?: CvType;
  onClose: () => void;
}

export function CvModal({ initialCv = 'devops', onClose }: CvModalProps) {
  const [activeCv, setActiveCv] = useState<CvType>(initialCv);

  useEffect(() => {
    setActiveCv(initialCv);
  }, [initialCv]);

  const cvFiles = {
    devops: {
      title: 'Ingénieur DevOps',
      pdf: '/cv-ingenieur-devops.pdf',
      filename: 'cv-david-herelle-ingenieur-devops.pdf',
      badge: 'DevOps / Cloud / SRE',
    },
    admin: {
      title: 'Administrateur Systèmes',
      pdf: '/cv-administrateur-systemes.pdf',
      filename: 'cv-david-herelle-administrateur-systemes.pdf',
      badge: 'Linux / SysAdmin / Infra',
    },
  };

  const current = cvFiles[activeCv];

  const handleOpenFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(current.pdf, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(current.pdf);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = current.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.warn('Erreur download fetch, fallback direct:', err);
      window.open(current.pdf, '_blank');
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 10050 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-xl"
        style={{ maxWidth: '950px', height: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content text-dark glass-card shadow-lg d-flex flex-column h-100 border-0" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
          {/* Header */}
          <div
            className="modal-header border-bottom py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
            style={{ position: 'relative', zIndex: 10, userSelect: 'none' }}
          >
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-file-earmark-person fs-4 text-danger"></i>
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
                className={`btn btn-sm d-flex align-items-center gap-1.5 ${activeCv === 'devops' ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCv('devops');
                }}
                style={{ fontSize: '12px' }}
              >
                <i className="bi bi-cpu"></i>
                <span>CV Ingénieur DevOps</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-1.5 ${activeCv === 'admin' ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCv('admin');
                }}
                style={{ fontSize: '12px' }}
              >
                <i className="bi bi-hdd-network"></i>
                <span>CV Admin Systèmes</span>
              </button>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={handleOpenFullscreen}
                className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
                style={{ fontSize: '11px' }}
                title="Ouvrir le PDF en plein écran"
              >
                <i className="bi bi-box-arrow-up-right"></i> Plein écran
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="btn btn-sm btn-outline-success py-1 px-2 d-flex align-items-center gap-1"
                style={{ fontSize: '11px' }}
                title="Télécharger le PDF"
              >
                <i className="bi bi-download"></i> PDF
              </button>
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
