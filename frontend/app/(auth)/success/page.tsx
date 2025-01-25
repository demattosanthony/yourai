"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");

  useEffect(() => {
    const syncData = async () => {
      if (session_id) {
        try {
          const response = await fetch(
            "http://localhost:4000/sync-after-success",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({ session_id }),
            }
          );

          console.log("Response from sync:", response);

          if (response.ok) {
            // Redirect the user after successful sync
            router.push("/"); // Or wherever you want to redirect them
          } else {
            console.error("Failed to sync data after success");
            // Handle error, maybe show a message to the user
          }
        } catch (error) {
          console.error("Error syncing data:", error);
          // Handle error
        }
      }
    };

    syncData();
  }, [session_id, router]);

  return (
    <div>
      <h1>Payment Successful!</h1>
      {/* You can show a loading indicator while syncing */}
      <p>Please wait while we update your account...</p>
    </div>
  );
};

export default SuccessPage;
