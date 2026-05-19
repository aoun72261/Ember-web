import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import PlayerBar from '@/components/PlayerBar'
import YouTubePlayerContainer from '@/components/YouTubePlayerContainer'
import ExpandedPlayer from '@/components/ExpandedPlayer'
import ThemeBackground from '@/components/ThemeBackground'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeBackground />

      <div className="flex h-screen overflow-hidden" style={{ background: 'transparent', position: 'relative', zIndex: 1 }}>
        <Sidebar />

        <main className="flex-1 overflow-hidden flex flex-col" style={{ background: '#121212' }}>
          {/* Spotify-style sticky top navigation bar */}
          <TopBar />
          {/* pb-[90px] = player bar height */}
          <div className="flex-1 overflow-y-auto pb-[90px]">
            {children}
          </div>
        </main>

        <PlayerBar />
        <YouTubePlayerContainer />
        <ExpandedPlayer />
      </div>
    </>
  )
}
