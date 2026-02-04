import { PageContainer } from '../../../components/layout/PageContainer';
import { UnderConstruction } from '../../../components/common';

function ArticlePage() {
  return (
    <PageContainer title={'Articles & Publications'}>
      <UnderConstruction 
        title="Museum Articles & Research Publications"
        description="This module manages scholarly articles, exhibition write-ups, and research publications related to the museum’s collections. It allows curators, researchers, and staff to document, publish, and link written works directly to accessioned artifacts and exhibitions."
        eta="TBD"
        features={[
          "Scholarly and Curatorial Article Management",
          "Linking Articles to Artifacts, Collections, and Exhibitions",
          "Peer Review and Editorial Approval Workflow",
          "Public and Internal Publication Controls",
          "Archival Storage of Research and Documentation",
        ]}
      />
    </PageContainer>
  )
}

export default ArticlePage


// Intake → Accession → Inventory → Exhibitions & Appointments → Research → Publications