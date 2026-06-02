// ═══════════════════════════════════════════════════════════
//  DirectVoiceLayer — چینی دەنگ بۆ گفتوگۆی تایبەت (١-بۆ-١)
//  بە درەنگ (lazy) دادەبەزرێت — livekit-client تەنها کاتێک
//  باردەکرێت کە بەکارهێنەر پەیوەندیی دەنگی دەست پێ دەکات.
// ═══════════════════════════════════════════════════════════
import { VoiceProvider } from './VoiceContext'
import DirectVoiceBar from '../components/DirectVoiceBar'

export default function DirectVoiceLayer({ roomId, identity, name, onEnd, otherIdentity, other }) {
  return (
    <VoiceProvider roomId={roomId} identity={identity} name={name} canSpeak>
      <DirectVoiceBar onEnd={onEnd} otherIdentity={otherIdentity} other={other} />
    </VoiceProvider>
  )
}
