import { PageContainer } from '../../../components/layout/PageContainer';
import { UnderConstruction } from '../../../components/common';

function AppointmentPage() {
  return (
    <PageContainer title={'Appointments & Scheduling'}>
      <UnderConstruction 
        title="Appointment & Visit Management"
        description="This module manages scheduled visits, artifact viewings, donor meetings, and curatorial appointments. It coordinates staff, visitors, and collection access to ensure that sensitive and valuable objects are handled in a controlled and secure manner."
        eta="TBD"
        features={[
          "Visitor, Donor, and Researcher Appointment Booking",
          "Private Artifact Viewing and Study Room Scheduling",
          "Staff and Curator Availability Management",
          "Approval Workflow for Restricted Collection Access",
          "Visit Logs and Access History Tracking",
        ]}
      />
    </PageContainer>
  )
}

export default AppointmentPage


// scheduled access to archives and storage

// supervised viewings of rare artifacts

// appointments with donors, curators, and researchers