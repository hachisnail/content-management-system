import { WipState } from '@/features/shared';

const CreateArticlePage = () => {
  return (
    <WipState 
      title="Draft New Article" 
      message="We are integrating a rich-text editor (WYSIWYG) here. You will be able to write content, upload featured images, and preview articles before publishing."
      backPath="/articles"
      backLabel="Cancel & Return"
    />
  );
};

export default CreateArticlePage;