import React from "react";

const Footer = () => {
  return (
    <footer style={{
      background: "#111",
      color: "#ccc",
      marginTop: "40px"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "15px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px"
        
      }}>
        
        {/* Left */}
        <div style={{ fontSize: "14px" }}>
          © {new Date().getFullYear()} Arghadeep Halder. All rights reserved.
        </div>

        {/* Center */}
        <div style={{
          display: "flex",
          gap: "15px",
          fontSize: "14px"
        }}>
          <a href="#" style={linkStyle}>About</a>
          <a href="#" style={linkStyle}>Privacy</a>
          <a href="#" style={linkStyle}>Terms</a>
        </div>

        {/* Right */}
        <div style={{ display: "flex", gap: "15px" }}>
          <a href="https://github.com/arghadeeph" target="_blank" rel="noreferrer" style={linkStyle}>
            GitHub
          </a>
          <a href="https://linkedin.com/in/thearghadeep" target="_blank" rel="noreferrer" style={linkStyle}>
            LinkedIn
          </a>
          <a href=" https://arghadeep-portfolio.vercel.app/" target="_blank" rel="noreferrer" style={linkStyle}>
            Portfolio
          </a>

        </div>

      </div>
    </footer>
  );
};

const linkStyle = {
  color: "#ccc",
  textDecoration: "none"
};

export default Footer;