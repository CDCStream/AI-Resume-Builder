import React from "react";

interface CoverLetterData {
  recipientName: string;
  recipientTitle: string;
  companyName: string;
  companyAddress: string;
  date: string;
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  senderName: string;
  senderTitle: string;
}

interface ProfessionalCoverLetterProps {
  data: CoverLetterData;
}

export default function ProfessionalCoverLetter({ data }: ProfessionalCoverLetterProps) {
  const paragraphs = data.body.split("\n\n").filter((p) => p.trim());

  return (
    <div
      className="bg-white shadow-lg"
      style={{
        width: "794px",
        height: "1122px",
        padding: "50px 60px",
        fontFamily: "'Times New Roman', serif",
        fontSize: "11pt",
        lineHeight: "1.5",
        color: "#333",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Header - Sender Info */}
      <div style={{ marginBottom: "25px" }}>
        <h1
          style={{
            fontSize: "22pt",
            fontWeight: "bold",
            color: "#1a365d",
            marginBottom: "2px",
          }}
        >
          {data.senderName}
        </h1>
        {data.senderTitle && (
          <p style={{ fontSize: "11pt", color: "#4a5568", margin: 0 }}>{data.senderTitle}</p>
        )}
      </div>

      {/* Date */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ margin: 0 }}>{data.date}</p>
      </div>

      {/* Recipient Info */}
      <div style={{ marginBottom: "20px" }}>
        {data.recipientName ? (
          <p style={{ margin: 0 }}>{data.recipientName}</p>
        ) : (
          data.recipientTitle && <p style={{ margin: 0 }}>{data.recipientTitle}</p>
        )}
        {data.companyName && <p style={{ fontWeight: "600", margin: 0 }}>{data.companyName}</p>}
        {data.companyAddress && <p style={{ margin: 0 }}>{data.companyAddress}</p>}
      </div>

      {/* Subject Line */}
      {data.subject && (
        <div style={{ marginBottom: "15px" }}>
          <p style={{ margin: 0 }}>
            <strong>Re: {data.subject}</strong>
          </p>
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom: "15px" }}>
        <p style={{ margin: 0 }}>{data.greeting}</p>
      </div>

      {/* Body */}
      <div style={{ marginBottom: "20px" }}>
        {paragraphs.map((paragraph, index) => (
          <p key={index} style={{ marginBottom: "12px", textAlign: "justify" }}>
            {paragraph}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginBottom: "25px" }}>
        <p style={{ margin: 0 }}>{data.closing}</p>
      </div>

      {/* Signature */}
      <div>
        <p style={{ fontWeight: "600", margin: 0 }}>{data.senderName}</p>
        {data.senderTitle && <p style={{ color: "#4a5568", margin: 0 }}>{data.senderTitle}</p>}
      </div>
    </div>
  );
}
