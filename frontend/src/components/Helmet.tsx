import { Helmet } from "react-helmet-async";

export default function MetaTags() {
    return (
        <Helmet>
            {/* Basic meta */}
            <title>EVEBoard — Contracts for Elite Capsuleers</title>
            <meta
                name="description"
                content="EVEBoard is a contract platform for EVE Online, built for capsuleers who operate in the shadows and shape the fate of empires."
            />

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content="EVEBoard — Contracts for Elite Capsuleers" />
            <meta
                property="og:description"
                content="A precision-crafted platform for contracts in EVE Online. Designed for mercenaries, spies, and leaders across New Eden."
            />
            <meta property="og:url" content="https://eveboard.space" />
            <meta property="og:image" content="https://eveboard.space/logo.png" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content="EVEBoard — Contracts for Elite Capsuleers" />
            <meta
                name="twitter:description"
                content="Contracts. Espionage. Empire-building. The next evolution of EVE Online interactions."
            />
            <meta name="twitter:image" content="https://eveboard.space/logo.png" />
        </Helmet>
    );
}
