export default function Footer() {
  return (
    <footer className="app-footer">
      <p>&copy; {new Date().getFullYear()} Meeting Intelligence Hub. All rights reserved.</p>
      <div className="footer-contact">
        <p>Contact: +91 8129441565</p>
        <a href="mailto:aaronjoy382@gmail.com">aaronjoy382@gmail.com</a>
        <a href="https://github.com/aar0njv" target="_blank" rel="noopener noreferrer">github.com/aar0njv</a>
      </div>
    </footer>
  );
}
