import "./ProgramacionSection.css";
import ProgramacionNoticiasSection from "./ProgramacionNoticiasSection";
import ProgramacionMusicaSection from "./ProgramacionMusicaSection";
import ProgramacionFarandulaSection from "./ProgramacionFarandulaSection";

const items = [
  { emoji: "📰", text: "Noticias", extra: <ProgramacionNoticiasSection /> },
  { emoji: "🌟", text: "Farándula", extra: <ProgramacionFarandulaSection /> },
  { emoji: "🎵", text: "Música", extra: <ProgramacionMusicaSection /> },
  { emoji: "ℹ️", text: "Información" },
  { emoji: "🎉", text: "Entretenimiento" },
  { emoji: "🔮", text: "Horóscopo" },
  { emoji: "🗣️", text: "Entrevistas" }
];

export default function ProgramacionSection() {
  return (
    <section className="programacion-section main-section" id="programacion">
      <h3 className="programacion-title">Programación</h3>
      <ul className="programacion-list">
        {items.map(({ emoji, text, extra }, i) => (
          <li className="programacion-item" key={text}>
            <span className="programacion-emoji" title={text}>{emoji}</span>
            <span className="programacion-text">{text}</span>
            {extra}
          </li>
        ))}
      </ul>
    </section>
  );
}
