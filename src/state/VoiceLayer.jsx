// ═══════════════════════════════════════════════════════════
//  VoiceLayer — چینی دەنگ بۆ ژووری ئۆنلاین
//  بە درەنگ (lazy) دادەبەزرێت، بۆیە کتێبخانەی قورسی livekit-client
//  تەنها کاتێک باردەکرێت کە یاریزان دەچێتە ژوورێکی ئۆنلاینەوە.
// ═══════════════════════════════════════════════════════════
import { VoiceProvider } from './VoiceContext'
import VoiceBar from '../components/VoiceBar'

export default function VoiceLayer({ roomId, identity, name, canSpeak }) {
  return (
    <VoiceProvider roomId={roomId} identity={identity} name={name} canSpeak={canSpeak}>
      <VoiceBar />
    </VoiceProvider>
  )
}
