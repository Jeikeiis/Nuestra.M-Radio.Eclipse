import './PodcastsSection.css';

export default function PodcastsSection() {
  return (
    <section className="podcasts-section main-section">
      <h3 className="podcasts-title">
        Podcasts Recientes
      </h3>
      <div className="podcasts-grid">
        <div className="podcasts-card">
          <span className="podcasts-title-card">
            Entrevista a Bandas Locales
          </span>
          <audio controls className="podcasts-audio">
            <source src="#" type="audio/mpeg" />
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
        <div className="podcasts-card">
          <span className="podcasts-title-card">
            Especial de Rock Nacional
          </span>
          <audio controls className="podcasts-audio">
            <source src="#" type="audio/mpeg" />
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
        <div className="podcasts-card">
          <span className="podcasts-title-card">
            Noticias de la Semana
          </span>
          <audio controls className="podcasts-audio">
            <source src="#" type="audio/mpeg" />
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      </div>
    </section>
  );
}
