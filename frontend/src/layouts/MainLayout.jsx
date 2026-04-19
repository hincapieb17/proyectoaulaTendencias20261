import Navbar from "./Navbar";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="main-container">{children}</main>
    </>
  );
}

export default MainLayout;