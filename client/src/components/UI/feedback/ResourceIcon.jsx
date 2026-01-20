import { User, FileText, Box } from "lucide-react"; 

const ResourceIcon = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case "users":
      return <User className={className} />;
    case "files":
      return <FileText className={className} />;
    case "test_items":
      return <Box className={className} />;
    default:
      return <Box className={className} />;
  }
};

export default ResourceIcon;
