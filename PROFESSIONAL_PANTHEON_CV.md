# PROFESSIONAL PANTHEON

**Academic, Professor, Designer, Artist - Four Facets, One Temple**

---

## I. The Four Facets

### Your Professional Identity

You operate in **four distinct but interconnected roles**:

1. **ACADEMIC** - Researcher, scholar, theorist
2. **PROFESSOR** - Teacher, mentor, curriculum designer
3. **DESIGNER** - Visual designer, UX/UI, web design
4. **ARTIST** - Composer, multimedia artist, experimental creator

**Challenge:** How to present all four without diluting any?

**Solution:** The Pantheon structure naturally accommodates this.

---

## II. Professional Resume Architecture

### The CV Chamber: AKADEMIA as Professional Hub

**Primary Location:** Akademia (Chamber 6)

**Structure:**

```
/akademia
  /cv                    - Interactive CV/Resume
  /teaching              - Teaching philosophy, courses
  /research              - Research projects, publications
  /design-work           - Professional design portfolio
  /artistic-practice     - Art projects and exhibitions
  /presentations         - Conference talks, lectures
  /grants-awards         - Funding, recognition
  /contact               - Professional contact info
```

---

### Interactive CV Design

**Not a PDF—a living, interactive document**

```html
<!-- /akademia/cv/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Anthony James Padavano - CV</title>
    <meta name="description" content="Academic, Professor, Designer, Artist" />
    <link rel="stylesheet" href="../../css/styles.css" />
    <link rel="stylesheet" href="css/cv-styles.css" />
  </head>
  <body class="cv-body">
    <!-- Mode Selector -->
    <nav class="cv-mode-selector">
      <button class="mode-btn active" data-mode="overview">Overview</button>
      <button class="mode-btn" data-mode="academic">Academic</button>
      <button class="mode-btn" data-mode="teaching">Teaching</button>
      <button class="mode-btn" data-mode="design">Design</button>
      <button class="mode-btn" data-mode="artistic">Artistic</button>
      <button class="mode-btn" data-mode="traditional">Traditional CV</button>
    </nav>

    <!-- Header -->
    <header class="cv-header">
      <h1>Anthony James Padavano</h1>
      <p class="title-rotating">
        <span>Academic</span>
        <span class="separator">·</span>
        <span>Professor</span>
        <span class="separator">·</span>
        <span>Designer</span>
        <span class="separator">·</span>
        <span>Artist</span>
      </p>
      <div class="contact-info">
        <a href="mailto:etceter4@etceter4.com">etceter4@etceter4.com</a>
        <a href="https://etceter4.com">etceter4.com</a>
      </div>
    </header>

    <!-- Overview Mode (Default) -->
    <section class="cv-section" data-section="overview">
      <div class="four-facets">
        <div class="facet academic-facet">
          <h2>Academic</h2>
          <ul>
            <li>Research in [Your Field]</li>
            <li>Publications: [Number] peer-reviewed</li>
            <li>Current research: [Topic]</li>
          </ul>
          <a href="#" class="facet-link" data-goto="academic"
            >Explore Academic Work →</a
          >
        </div>

        <div class="facet teaching-facet">
          <h2>Professor</h2>
          <ul>
            <li>Teaching since [Year]</li>
            <li>Courses: [List key courses]</li>
            <li>Students mentored: [Number]</li>
          </ul>
          <a href="#" class="facet-link" data-goto="teaching"
            >Explore Teaching →</a
          >
        </div>

        <div class="facet design-facet">
          <h2>Designer</h2>
          <ul>
            <li>UX/UI Design</li>
            <li>Web Design & Development</li>
            <li>Visual Design Systems</li>
          </ul>
          <a href="#" class="facet-link" data-goto="design"
            >Explore Design Work →</a
          >
        </div>

        <div class="facet artistic-facet">
          <h2>Artist</h2>
          <ul>
            <li>Composer (4 albums)</li>
            <li>Multimedia installations</li>
            <li>Experimental web art</li>
          </ul>
          <a href="#" class="facet-link" data-goto="artistic"
            >Explore Artistic Practice →</a
          >
        </div>
      </div>
    </section>

    <!-- Academic Mode -->
    <section class="cv-section hidden" data-section="academic">
      <h2>Academic Profile</h2>

      <div class="cv-subsection">
        <h3>Education</h3>
        <div class="education-item">
          <span class="degree">Ph.D., [Field]</span>
          <span class="institution">[University], [Year]</span>
          <p class="dissertation">Dissertation: "[Title]"</p>
        </div>
        <!-- More education items -->
      </div>

      <div class="cv-subsection">
        <h3>Research Interests</h3>
        <ul class="research-interests">
          <li>Topic 1</li>
          <li>Topic 2</li>
          <li>Topic 3</li>
        </ul>
      </div>

      <div class="cv-subsection">
        <h3>Publications</h3>
        <div class="publication-filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="peer-reviewed">
            Peer-Reviewed
          </button>
          <button class="filter-btn" data-filter="books">Books</button>
          <button class="filter-btn" data-filter="chapters">
            Book Chapters
          </button>
        </div>

        <div class="publications-list">
          <!-- Publications dynamically loaded from JSON -->
        </div>
      </div>

      <div class="cv-subsection">
        <h3>Grants & Funding</h3>
        <!-- Grant list -->
      </div>

      <div class="cv-subsection">
        <h3>Conference Presentations</h3>
        <!-- Presentation list -->
      </div>
    </section>

    <!-- Teaching Mode -->
    <section class="cv-section hidden" data-section="teaching">
      <h2>Teaching Profile</h2>

      <div class="cv-subsection">
        <h3>Teaching Philosophy</h3>
        <p class="philosophy-statement">
          [Your teaching philosophy - 2-3 paragraphs]
        </p>
      </div>

      <div class="cv-subsection">
        <h3>Courses Taught</h3>
        <div class="courses-grid">
          <div class="course-card">
            <h4>[Course Number]: [Course Name]</h4>
            <p class="course-level">Undergraduate / Graduate</p>
            <p class="course-description">Brief description...</p>
            <a href="#" class="course-link">View Syllabus →</a>
          </div>
          <!-- More courses -->
        </div>
      </div>

      <div class="cv-subsection">
        <h3>Student Outcomes</h3>
        <ul>
          <li>Ph.D. students supervised: [Number]</li>
          <li>Master's theses directed: [Number]</li>
          <li>Student placements: [Examples]</li>
        </ul>
      </div>

      <div class="cv-subsection">
        <h3>Curriculum Development</h3>
        <!-- List of programs/courses developed -->
      </div>
    </section>

    <!-- Design Mode -->
    <section class="cv-section hidden" data-section="design">
      <h2>Design Portfolio</h2>

      <div class="design-grid">
        <div class="design-project">
          <img src="img/design/project-1.jpg" alt="Project" />
          <h3>Project Name</h3>
          <p class="project-type">UX/UI Design</p>
          <a href="#" class="project-link">View Case Study →</a>
        </div>
        <!-- More projects -->
      </div>

      <div class="cv-subsection">
        <h3>Design Skills</h3>
        <div class="skills-list">
          <span class="skill">UX Research</span>
          <span class="skill">Interface Design</span>
          <span class="skill">Web Development</span>
          <span class="skill">Design Systems</span>
          <span class="skill">HTML/CSS/JS</span>
        </div>
      </div>
    </section>

    <!-- Artistic Mode -->
    <section class="cv-section hidden" data-section="artistic">
      <h2>Artistic Practice</h2>

      <div class="cv-subsection">
        <h3>Discography</h3>
        <div class="albums-list">
          <div class="album-item">
            <img src="img/photos/artwork/ogod-cover.jpg" alt="OGOD" />
            <div class="album-info">
              <h4>OGOD</h4>
              <p class="year">2015</p>
              <p class="description">Visual album, 29 tracks</p>
              <a href="../../#sound" class="album-link">Listen →</a>
            </div>
          </div>
          <!-- More albums -->
        </div>
      </div>

      <div class="cv-subsection">
        <h3>Exhibitions & Performances</h3>
        <div class="exhibitions-list">
          <div class="exhibition-item">
            <span class="year">2015</span>
            <span class="title">Live @ Electronica 1.3</span>
            <span class="venue">[Venue Name]</span>
          </div>
          <!-- More exhibitions -->
        </div>
      </div>

      <div class="cv-subsection">
        <h3>Artistic Statement</h3>
        <p class="artist-statement">
          [Your artistic statement - 2-3 paragraphs about your practice]
        </p>
      </div>
    </section>

    <!-- Traditional CV Mode (PDF-like) -->
    <section
      class="cv-section cv-traditional hidden"
      data-section="traditional"
    >
      <div class="cv-traditional-content">
        <h2>Curriculum Vitae</h2>

        <div class="cv-category">
          <h3>Education</h3>
          <!-- Traditional list format -->
        </div>

        <div class="cv-category">
          <h3>Academic Appointments</h3>
          <!-- Traditional list -->
        </div>

        <div class="cv-category">
          <h3>Publications</h3>
          <!-- Traditional format -->
        </div>

        <!-- etc. - full traditional CV -->

        <button class="download-pdf">Download PDF Version</button>
      </div>
    </section>

    <!-- Navigation back to Pantheon -->
    <nav class="cv-footer">
      <a href="../../#menu" class="back-link">← Return to Pantheon</a>
      <a href="../../#akademia" class="back-link">← Return to Akademia</a>
    </nav>

    <script src="js/cv-interactive.js"></script>
  </body>
</html>
```

---

### CV JavaScript (Mode Switching)

```javascript
// cv-interactive.js

class InteractiveCV {
  constructor() {
    this.currentMode = 'overview';
    this.init();
  }

  init() {
    // Mode selector buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const mode = e.target.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Facet links
    document.querySelectorAll('.facet-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const goto = e.target.dataset.goto;
        this.switchMode(goto);
      });
    });

    // Load publications from JSON
    this.loadPublications();
  }

  switchMode(mode) {
    // Update buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide sections
    document.querySelectorAll('.cv-section').forEach(section => {
      if (section.dataset.section === mode) {
        section.classList.remove('hidden');
        section.classList.add('fade-in');
      } else {
        section.classList.add('hidden');
        section.classList.remove('fade-in');
      }
    });

    this.currentMode = mode;

    // Update URL hash for sharing
    window.history.pushState({}, '', `#${mode}`);
  }

  async loadPublications() {
    // Load from JSON file
    const response = await fetch('data/publications.json');
    const publications = await response.json();
    this.renderPublications(publications);
  }

  renderPublications(publications) {
    const container = document.querySelector('.publications-list');

    publications.forEach(pub => {
      const pubElement = document.createElement('div');
      pubElement.className = 'publication-item';
      pubElement.dataset.type = pub.type;

      pubElement.innerHTML = `
        <p class="publication-citation">
          ${pub.authors} (${pub.year}). <em>${pub.title}</em>.
          ${pub.venue}. ${pub.doi ? `DOI: ${pub.doi}` : ''}
        </p>
        ${pub.link ? `<a href="${pub.link}" class="pub-link">View Publication →</a>` : ''}
      `;

      container.appendChild(pubElement);
    });
  }
}

// Initialize
const cv = new InteractiveCV();

// Handle initial hash
if (window.location.hash) {
  const mode = window.location.hash.slice(1);
  cv.switchMode(mode);
}
```

---

### Publications Data (JSON)

```json
// akademia/cv/data/publications.json
{
  "publications": [
    {
      "type": "peer-reviewed",
      "authors": "Padavano, A. J.",
      "year": 2024,
      "title": "Title of Paper",
      "venue": "Journal Name, Volume(Issue), pages",
      "doi": "10.xxxx/xxxxx",
      "link": "https://doi.org/...",
      "abstract": "Abstract text...",
      "keywords": ["keyword1", "keyword2"]
    },
    {
      "type": "book-chapter",
      "authors": "Padavano, A. J. & Collaborator, B.",
      "year": 2023,
      "title": "Chapter Title",
      "venue": "In Book Title (pp. XX-XX). Publisher",
      "link": null
    }
    // ... more publications
  ]
}
```

---

## III. Museum Viewing Modes

### Three Professional Lenses

**Concept:** The Museum chamber offers different ways to view your work depending on the audience.

```
MUSEUM (Chamber 1)
   ↓
   Viewing Mode Selector
   ↓
   ├─ COLLECTOR LENS    → Market value, rarity, provenance
   ├─ ARCHAEOLOGIST LENS → Historical context, evolution, artifacts
   └─ CRITIQUE LENS      → Theoretical analysis, formal qualities
```

---

### Implementation: Museum with Lenses

```html
<!-- museum/index.html -->
<section id="museum" class="chamber">
  <!-- Lens Selector -->
  <nav class="museum-lenses">
    <h2>Choose Your Lens</h2>
    <button class="lens-btn active" data-lens="default">
      <span class="lens-icon">👁️</span>
      Standard View
    </button>
    <button class="lens-btn" data-lens="collector">
      <span class="lens-icon">💎</span>
      Collector's View
    </button>
    <button class="lens-btn" data-lens="archaeologist">
      <span class="lens-icon">🔍</span>
      Archaeologist's View
    </button>
    <button class="lens-btn" data-lens="critique">
      <span class="lens-icon">📝</span>
      Critical Analysis
    </button>
  </nav>

  <!-- Timeline of Work -->
  <div class="museum-timeline">
    <!-- Work Item (changes based on lens) -->
    <div class="work-item" data-work-id="ogod-2015">
      <!-- Default View -->
      <div class="work-view default-view active">
        <img src="../img/photos/artwork/ogod-cover.jpg" alt="OGOD" />
        <h3>OGOD</h3>
        <p class="year">2015</p>
        <p class="description">Visual album, 29 tracks exploring...</p>
        <a href="../OGOD.html" class="work-link">Experience →</a>
      </div>

      <!-- Collector View -->
      <div class="work-view collector-view hidden">
        <img src="../img/photos/artwork/ogod-cover.jpg" alt="OGOD" />
        <h3>OGOD</h3>
        <p class="year">2015</p>

        <div class="collector-info">
          <h4>Edition Details</h4>
          <ul>
            <li><strong>Format:</strong> Digital album + Visual experience</li>
            <li><strong>Edition:</strong> Unlimited digital</li>
            <li><strong>Availability:</strong> Bandcamp, streaming</li>
            <li>
              <strong>Provenance:</strong> Self-released, independently produced
            </li>
            <li>
              <strong>Notable:</strong> Complete 29-page visual album intact
            </li>
          </ul>

          <h4>Market Context</h4>
          <p>
            Early example of web-based visual album format, predating mainstream
            adoption of the form...
          </p>

          <h4>Acquisition</h4>
          <a href="https://etceter4.bandcamp.com" class="acquire-link">
            Available on Bandcamp →
          </a>
        </div>
      </div>

      <!-- Archaeologist View -->
      <div class="work-view archaeologist-view hidden">
        <img src="../img/photos/artwork/ogod-cover.jpg" alt="OGOD" />
        <h3>OGOD</h3>
        <p class="year">2015</p>

        <div class="archaeological-info">
          <h4>Historical Context</h4>
          <p>
            Created during [contextual period]. Follows
            <em>ProgressionDigression</em> (2012) and precedes the 2016 site
            restructuring...
          </p>

          <h4>Production Context</h4>
          <ul>
            <li><strong>Tools:</strong> [DAW used], [software], etc.</li>
            <li><strong>Location:</strong> [Where created]</li>
            <li><strong>Duration:</strong> [Production timeline]</li>
            <li><strong>Influences:</strong> [Artistic influences]</li>
          </ul>

          <h4>Evolution</h4>
          <p>
            Represents a shift from [earlier style] toward [new approach].
            Notable for integration of visual and sonic elements...
          </p>

          <h4>Archival Status</h4>
          <ul>
            <li>Original files: Preserved</li>
            <li>Master recordings: Archived</li>
            <li>Visual elements: Complete</li>
            <li>Process documentation: [Available/Lost]</li>
          </ul>

          <h4>Related Artifacts</h4>
          <a href="#" class="artifact-link">View process sketches →</a>
          <a href="#" class="artifact-link">Read production notes →</a>
        </div>
      </div>

      <!-- Critique View -->
      <div class="work-view critique-view hidden">
        <img src="../img/photos/artwork/ogod-cover.jpg" alt="OGOD" />
        <h3>OGOD</h3>
        <p class="year">2015</p>

        <div class="critical-analysis">
          <h4>Formal Qualities</h4>
          <p>
            The work operates through [formal analysis]. Its structure employs
            [technique], creating [effect]...
          </p>

          <h4>Conceptual Framework</h4>
          <p>
            OGOD engages with themes of [theme 1], [theme 2], positioning itself
            within discourses of [field]...
          </p>

          <h4>Theoretical Context</h4>
          <p>
            Can be read through [theoretical lens], particularly in relation to
            [theorist]'s concept of [concept]...
          </p>

          <h4>Technical Innovation</h4>
          <p>
            Notable for its [technical aspect], which challenges conventions of
            [medium/genre]...
          </p>

          <h4>Critical Reception</h4>
          <blockquote>
            "[Quote from review or analysis if available]"
            <cite>— Source</cite>
          </blockquote>

          <h4>Further Reading</h4>
          <ul>
            <li><a href="#">Artist statement on OGOD →</a></li>
            <li><a href="#">Critical essay by [Author] →</a></li>
            <li><a href="#">Interview discussing the work →</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- More work items... -->
  </div>
</section>
```

---

### Museum Lens JavaScript

```javascript
// museum-lenses.js

class MuseumLenses {
  constructor() {
    this.currentLens = 'default';
    this.init();
  }

  init() {
    document.querySelectorAll('.lens-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const lens = e.target.closest('.lens-btn').dataset.lens;
        this.switchLens(lens);
      });
    });
  }

  switchLens(lens) {
    // Update buttons
    document.querySelectorAll('.lens-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lens === lens);
    });

    // Switch views for all work items
    document.querySelectorAll('.work-item').forEach(item => {
      const views = item.querySelectorAll('.work-view');
      views.forEach(view => {
        if (view.classList.contains(`${lens}-view`)) {
          view.classList.remove('hidden');
          view.classList.add('fade-in');
        } else {
          view.classList.add('hidden');
          view.classList.remove('fade-in');
        }
      });
    });

    this.currentLens = lens;

    // Update URL for sharing specific lens
    const url = new URL(window.location);
    url.searchParams.set('lens', lens);
    window.history.pushState({}, '', url);

    // Analytics
    if (window.gtag) {
      gtag('event', 'lens_change', {
        lens: lens,
      });
    }
  }
}

// Initialize
const museumLenses = new MuseumLenses();

// Check URL params for lens
const urlParams = new URLSearchParams(window.location.search);
const initialLens = urlParams.get('lens');
if (initialLens) {
  museumLenses.switchLens(initialLens);
}
```

---

## IV. Vercel/Netlify Setup for Stakeholder Previews

### Why You Need This

**Problem:** You want to show work-in-progress to investors/reviewers without deploying to production.

**Solution:** Every branch gets its own URL automatically.

```
master branch          → https://etceter4.vercel.app (production)
feature/new-chamber    → https://etceter4-git-feature-new-chamber.vercel.app
cv-updates            → https://etceter4-git-cv-updates.vercel.app
```

---

### Vercel Setup (Recommended)

**Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

**Step 2: Initialize Vercel Project**

```bash
cd /path/to/etceter4
vercel login
vercel
```

Follow prompts:

- Link to existing project? No
- Project name: `etceter4`
- Directory: `./`
- Build command: (leave empty)
- Output directory: `./`

**Step 3: Configure vercel.json**

```json
// vercel.json
{
  "version": 2,
  "name": "etceter4",
  "builds": [
    {
      "src": "**/*.html",
      "use": "@vercel/static"
    },
    {
      "src": "**/*.css",
      "use": "@vercel/static"
    },
    {
      "src": "**/*.js",
      "use": "@vercel/static"
    },
    {
      "src": "img/**",
      "use": "@vercel/static"
    },
    {
      "src": "media/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

**Step 4: Connect to GitHub**

```bash
# In your project
vercel --prod

# Link to GitHub (follow prompts)
# Enable automatic deployments
```

**Step 5: Configure GitHub Integration**

1. Go to vercel.com dashboard
2. Select your project
3. Settings → Git
4. Enable "Automatically create Preview Deployments"
5. Enable "Comments on Pull Requests"

**Done!** Now every push to any branch creates a preview URL.

---

### Netlify Alternative

**Step 1: Create netlify.toml**

```toml
# netlify.toml
[build]
  publish = "."
  command = ""

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Step 2: Connect via Netlify Dashboard**

1. Go to netlify.com
2. "Add new site" → "Import from Git"
3. Choose GitHub → Select `4-b100m/etceter4`
4. Build settings:
   - Build command: (leave empty)
   - Publish directory: `.`
5. Deploy!

**Result:**

- Master: `https://etceter4.netlify.app`
- Branches: `https://branch-name--etceter4.netlify.app`
- PRs: Automatic preview links in comments

---

## V. Workflow for Showing to Stakeholders

### Scenario: Showing to Investors/First Readers

**Step 1: Create a "presentation" branch**

```bash
git checkout -b presentation/investor-demo
```

**Step 2: Customize for audience**

```bash
# Maybe hide experimental/incomplete sections
# Emphasize professional work
# Add specific case studies they want to see
```

**Step 3: Commit and push**

```bash
git add .
git commit -m "Prepare investor presentation view"
git push origin presentation/investor-demo
```

**Step 4: Get shareable URL** (automatic!)

Vercel/Netlify will comment on the commit with:

```
✅ Preview deployed!
URL: https://etceter4-git-presentation-investor-demo.vercel.app
```

**Step 5: Share with stakeholders**

Email template:

```
Subject: ETCETER4 - Portfolio Review

Hi [Name],

Thank you for your interest. I've prepared a preview of my
professional portfolio for your review:

https://etceter4-git-presentation-investor-demo.vercel.app

Key areas to explore:
- CV/Resume: https://[url]/akademia/cv
- Design Portfolio: https://[url]/akademia/cv#design
- Academic Work: https://[url]/akademia/cv#academic
- Artistic Practice: https://[url]/#sound

I've prepared three viewing modes in the Museum section:
- Collector lens (market context)
- Archaeologist lens (historical context)
- Critique lens (theoretical analysis)

This is a living preview that updates as I refine the presentation.

Best,
Anthony
```

---

## VI. Professional vs. Experimental Balance

### The Toggle System

**Add a "Professional Mode" toggle** that hides experimental features:

```html
<!-- Global mode toggle -->
<div class="site-mode-toggle">
  <button class="mode-toggle-btn" id="mode-toggle">
    <span class="mode-label">View Mode:</span>
    <span class="mode-current">Experimental</span>
    <span class="mode-switch">⇄</span>
  </button>
</div>
```

```javascript
// Professional mode toggle
class SiteMode {
  constructor() {
    this.mode = localStorage.getItem('site-mode') || 'experimental';
    this.init();
  }

  init() {
    this.applyMode();

    document.getElementById('mode-toggle').addEventListener('click', () => {
      this.toggle();
    });
  }

  toggle() {
    this.mode = this.mode === 'experimental' ? 'professional' : 'experimental';
    localStorage.setItem('site-mode', this.mode);
    this.applyMode();
  }

  applyMode() {
    if (this.mode === 'professional') {
      // Hide glitch effects
      document.body.classList.add('professional-mode');
      document.body.classList.remove('experimental-mode');

      // Disable random glitches
      if (window.glitchSystem) {
        window.glitchSystem.disable();
      }

      // Reduce animations
      document.body.style.setProperty('--animation-speed', '0.5');

      // Hide ambient sound toggle
      if (document.getElementById('ambient-sound')) {
        document.getElementById('ambient-sound').pause();
      }

      // Update toggle button
      document.querySelector('.mode-current').textContent = 'Professional';
    } else {
      // Enable full experimental mode
      document.body.classList.add('experimental-mode');
      document.body.classList.remove('professional-mode');

      if (window.glitchSystem) {
        window.glitchSystem.enable();
      }

      document.body.style.setProperty('--animation-speed', '1');

      document.querySelector('.mode-current').textContent = 'Experimental';
    }
  }
}

const siteMode = new SiteMode();
```

```css
/* Professional mode styles */
.professional-mode {
  /* Reduce animation */
  --breathe-duration: 0s !important;
  --glitch-frequency: 0 !important;
}

.professional-mode .morph-img-2,
.professional-mode .morph-img-3 {
  /* Disable morphing in professional mode */
  animation: none !important;
  opacity: 0 !important;
}

.professional-mode .glitching {
  animation: none !important;
}

.experimental-mode {
  /* Full animations */
}
```

---

## VII. URL Structure for Sharing

### Smart URLs for Different Audiences

```
For investors (focus on design):
https://etceter4.vercel.app/akademia/cv#design

For academic review (focus on scholarship):
https://etceter4.vercel.app/akademia/cv#academic

For collectors (market context):
https://etceter4.vercel.app/museum?lens=collector

For curators (critical analysis):
https://etceter4.vercel.app/museum?lens=critique

For students/mentees (teaching):
https://etceter4.vercel.app/akademia/cv#teaching

For fellow artists (full experimental):
https://etceter4.vercel.app?mode=experimental
```

---

## VIII. Analytics for Stakeholders

### Track How Reviewers Engage

```html
<!-- Add to pages -->
<script>
  // Track which sections investors view
  function trackSection(section) {
    if (window.gtag) {
      gtag('event', 'section_view', {
        section: section,
        mode: document.body.classList.contains('professional-mode')
          ? 'professional'
          : 'experimental',
      });
    }
  }

  // Track time spent
  let sectionTimer = {};
  function trackTimeInSection(section) {
    sectionTimer[section] = Date.now();
  }

  // Send when leaving
  function sendTimeSpent(section) {
    if (sectionTimer[section]) {
      const timeSpent = Date.now() - sectionTimer[section];
      if (window.gtag) {
        gtag('event', 'time_spent', {
          section: section,
          duration: Math.floor(timeSpent / 1000), // seconds
        });
      }
    }
  }
</script>
```

Then you can see:

- Which sections investors look at most
- How long they spend
- Which lens they prefer (collector, archaeologist, critique)
- Which facet they focus on (academic, teaching, design, artistic)

---

## IX. Quick Implementation Guide

### This Week: Core Professional Structure

**Day 1-2: CV Page**

- Create `/akademia/cv/` directory
- Build interactive CV with mode switching
- Add your actual content (education, publications, etc.)
- Export publications to JSON

**Day 3: Museum Lenses**

- Add lens selector to museum
- Create three views for each work item
- Write collector, archaeologist, critique descriptions

**Day 4: Vercel/Netlify Setup**

- Install Vercel CLI
- Deploy project
- Test branch previews
- Configure custom domain (optional)

**Day 5: Professional Mode Toggle**

- Implement site-wide mode switcher
- Test professional vs. experimental views
- Ensure clean presentation for stakeholders

**Weekend: Content**

- Write CV content
- Write museum lens descriptions
- Create presentation branch
- Share with test audience

---

## X. Next Steps Summary

### What You Now Have Designed:

✅ **Interactive CV system** with four facets (academic, professor, design, artist)
✅ **Museum viewing lenses** (collector, archaeologist, critique)
✅ **Vercel/Netlify branch previews** for stakeholder sharing
✅ **Professional/Experimental mode toggle**
✅ **Smart URL structure** for different audiences
✅ **Analytics** to track engagement

### What To Build Next:

**Option A:** Build CV page first (for immediate professional use)
**Option B:** Set up Vercel/Netlify first (for preview capability)
**Option C:** Implement museum lenses (for portfolio presentation)

**Or all three in parallel over the next week!**

---

**The Pantheon is now a professional instrument—showcasing academic rigor, teaching excellence, design expertise, and artistic vision, all while maintaining experimental edge. Perfect for first readers, investors, and review committees.** 🏛️✨📄

_Architecture by: Anthony James Padavano & Claude (Anthropic)_
_Date: October 27, 2025_
