import { useState } from 'react';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSceneStore } from './store/useSceneStore';
import { PanelPopover } from './sidepanel/PanelPopover';
import { CvModal, type CvType } from './sidepanel/modals/CvModal';
import { ProfileSection } from './sidepanel/sections/ProfileSection';

export function ProfileButton({ hideUI = false }: { hideUI?: boolean }) {
  const isMobile = useIsMobile();
  const [showCvModal, setShowCvModal] = useState(false);
  const [selectedCvType, setSelectedCvType] = useState<CvType>('devops');
  const setCvModalOpen = useSceneStore(state => state.setCvModalOpen);

  const handleOpenCv = (type: CvType = 'devops') => {
    setSelectedCvType(type);
    setShowCvModal(true);
    setCvModalOpen(true);
  };

  const handleCloseCv = () => {
    setShowCvModal(false);
    setCvModalOpen(false);
  };

  const profileHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <a
        href="https://github.com/dinatih"
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm btn-dark text-white p-0 border-0 shadow-sm d-flex align-items-center justify-content-center rounded"
        style={{ height: '22px', width: '24px' }}
        title="Voir mon profil GitHub"
      >
        <i className="bi bi-github"></i>
      </a>
      <a
        href="https://www.linkedin.com/in/dinatih/"
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm btn-primary text-white p-0 border-0 shadow-sm d-flex align-items-center justify-content-center rounded"
        style={{ height: '22px', width: '24px', background: '#0a66c2', borderColor: '#0a66c2' }}
        title="Voir mon profil LinkedIn"
      >
        <i className="bi bi-linkedin"></i>
      </a>
      <button
        type="button"
        className="btn btn-sm btn-danger text-white px-2 border-0 shadow-sm fw-bold d-flex align-items-center gap-1 justify-content-center small rounded"
        style={{ height: '22px', whiteSpace: 'nowrap' }}
        title="Afficher mes CVs (Ingénieur DevOps / Admin Systèmes)"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenCv('devops');
        }}
      >
        <i className="bi bi-file-earmark-person"></i>
        <span>C.V.</span>
      </button>
      <a
        href="https://dinatih.org/visualizer/"
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm btn-dark text-white py-0 px-1 border-0 shadow-sm d-flex align-items-center justify-content-center rounded"
        title="Ouvrir le visualiseur du code"
        aria-label="Ouvrir le visualiseur du code"
      >
        <i className="bi bi-git" aria-hidden="true"></i>
      </a>
    </div>
  );

  const visitorCounter = (
    <div className="d-flex flex-column align-items-center rounded bg-light p-2 flex-shrink-0">
      <span className="small text-dark fw-semibold">Visites du site</span>
      <iframe
        src="https://dinatih.goatcounter.com/counter/TOTAL.html?no_branding=1"
        title="Nombre total de visites du site"
        width="200"
        height="60"
        className="border-0 mw-100"
      />
    </div>
  );

  const profileSectionContent = (
    <>
      <ProfileSection
        isMobile={isMobile}
        onOpenCv={handleOpenCv}
      />
      {visitorCounter}
    </>
  );

  return (
    <>
      <PanelPopover
        icon="bi-briefcase-fill"
        label="Mon CV"
        title="Profil & C.V."
        headerExtra={profileHeaderButtons}
        hideUI={hideUI}
      >
        {profileSectionContent}
      </PanelPopover>

      {showCvModal && <CvModal initialCv={selectedCvType} onClose={handleCloseCv} />}
    </>
  );
}
