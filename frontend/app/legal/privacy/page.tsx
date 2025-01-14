"use client";

import ReactMarkdown from "react-markdown";

export default function PrivacyPolicyPage() {
  return (
    <div className="h-screen w-screen justify-center flex">
      <div className="flex flex-col w-full max-w-[800px] py-24 gap-2">
        <ReactMarkdown className={"gap-6 flex flex-col"}>{`**Privacy Policy**

Effective Date: Jan 13th, 2024

At Yo (Yo..our AI), your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our app and services.

1. Information We Collect

Personal Information: When you sign in with Google OAuth, we collect your email address and basic profile information.
Usage Data: We collect data on how you interact with our app, including your chat histories and interactions with various AI models.
Chat Content: We store the conversations you have with AI models in our database.
2. How We Use Your Information

To Provide Services: We use your information to facilitate interactions with AI models and maintain chat history.
Improvement: We analyze usage patterns and anonymized conversation data to improve our service and AI interactions.
Communication: We may send you important updates about our app and new features.
3. Data Storage

Your chat histories and interactions are stored in our PostgreSQL database
We implement industry-standard security measures to protect your data
While we maintain reasonable safeguards, no internet transmission is completely secure
4. Sharing Your Information We do not sell your personal information. We may share data in the following circumstances:

Third-Party AI Providers: Your queries may be processed through various AI model providers
Legal Requirements: We may disclose information if required by law
Service Providers: We may share data with trusted service providers who assist in operating our service
5. Security We take appropriate security measures to protect your data from unauthorized access or disclosure, including:

Encrypted data transmission
Secure database storage
Regular security audits
6. Your Choices You can:

Access your chat history
Request deletion of your account and associated data
Manage your account settings
Opt-out of non-essential communications
7. Changes to This Policy We may update this Privacy Policy periodically. We will notify you of any changes by updating the date at the top of this policy.

8. Contact Us If you have any questions or concerns about this Privacy Policy, please contact us at demattosanthony@gmail.com.`}</ReactMarkdown>
      </div>
    </div>
  );
}
