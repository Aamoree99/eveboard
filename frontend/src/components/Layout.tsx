import React from 'react';
import Header from './Header';
import Footer from "./Footer.tsx";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="layout">
            <Header />
            <main className="main">{children}</main>
            <Footer />
        </div>
    )
}

export default Layout;