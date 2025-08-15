import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export default function Onboarding() {
  const [username, setUsername] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const docsRef = doc(db, "users", user.uid);

      getDoc(docsRef).then((doc) => {
        if (doc.exists()) {
          if (doc.data().username) {
            navigate("/online-lobby");
          }
        }
      });
    }
  }, [user]);

  const handleOnboarding = async () => {
    if (username.length < 3 || !user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        username,
        email: user.email,
        uid: user.uid,
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <h1 className="text-3xl font-bold text-center">Choose a Username</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        className="w-full p-3 rounded-lg border"
      />
      <Button
        onClick={handleOnboarding}
        disabled={loading || username.length < 3}
      >
        {loading ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}
