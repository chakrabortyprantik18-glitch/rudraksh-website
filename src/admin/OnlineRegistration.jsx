
import { ExternalLink, ClipboardList } from "lucide-react";
import "./OnlineRegistration.css";

function OnlineRegistration() {
  return (
    <div className="online-registration">
      <div className="online-registration-heading">
        <ClipboardList size={25} />
        <h1>Online Registration</h1>
      </div>

      <p>
        Access the Rudraksh online registration management panel.
      </p>

      <a
        href="https://www.rudrakshsocialculturalorganization.online/forms/admin"
        className="registration-button"
      >
        Redirect to Registration Form Making
        <ExternalLink size={17} />
      </a>
    </div>
  );
}

export default OnlineRegistration;
