import { useParams } from 'react-router-dom';
import { WipState } from '@/features/shared';

const EditArticlePage = () => {
  const { id } = useParams();

  return (
    <WipState 
      title={`Edit Article #${id}`} 
      message="This interface will load existing article data for modification. It will support version history and status updates (Draft/Published/Archived)."
      backPath="/articles"
      backLabel="Back to List"
    />
  );
};

export default EditArticlePage;