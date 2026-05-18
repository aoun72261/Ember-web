import Sidebar from '@/components/Sidebar'
import PlayerBar from '@/components/PlayerBar'
import YouTubePlayerContainer from '@/components/YouTubePlayerContainer'
import ExpandedPlayer from '@/components/ExpandedPlayer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent', position: 'relative', zIndex: 1 }}>
      <Sidebar />

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* pb-[68px] = player bar height */}
        <div className="flex-1 overflow-y-auto pb-[68px]">
          {children}
        </div>
      </main>

      <PlayerBar />
      <YouTubePlayerContainer />
      <ExpandedPlayer />
    </div>
  )
}
