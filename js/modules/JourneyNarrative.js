'use strict';

/**
 * @file JourneyNarrative.js
 * @description Generates poetic summaries from JourneyTracker data.
 * Produces human-readable narrative text about the visitor's path through the site.
 *
 * @requires JourneyTracker
 */

// eslint-disable-next-line no-unused-vars
class JourneyNarrative {
  /** @type {Object<string, string>} Chamber display names */
  static CHAMBER_NAMES = {
    akademia: 'Akademia',
    bibliotheke: 'Bibliotheke',
    pinakotheke: 'Pinakotheke',
    agora: 'Agora',
    symposion: 'Symposion',
    oikos: 'Oikos',
    odeion: 'Odeion',
    theatron: 'Theatron',
    ergasterion: 'Ergasterion',
    khronos: 'Khronos',
    'ogod3d': 'OGOD Immersive',
    'ogod-viewer': 'OGOD Animation',
    discovery: 'Discovery',
    stills: 'Stills Gallery',
    diary: 'Diary',
    video: 'Video Theater',
  };

  /** @type {Object<string, string>} Wing groupings */
  static WINGS = {
    'East Wing': ['akademia', 'bibliotheke', 'pinakotheke'],
    'West Wing': ['agora', 'symposion', 'oikos'],
    'South Wing': ['odeion', 'theatron'],
    'North Wing': ['ergasterion', 'khronos'],
  };

  /** @type {Object<string, string>} Interaction type descriptions */
  static INTERACTION_VERBS = {
    poem_read: 'reading poems',
    poem_generated: 'generating poems',
    sketch_viewed: 'viewing sketches',
    journal_written: 'writing journal entries',
    journal_generated: 'generating reflections',
    timeline_explored: 'exploring the timeline',
    dialogue_read: 'engaging in dialogues',
    dialogue_generated: 'generating conversations',
    visual_generated: 'creating visual pieces',
    exhibit_viewed: 'examining exhibits',
  };

  /**
   * Generate a poetic narrative from journey data
   * @param {Object} summary - From JourneyTracker.getSummary()
   * @returns {string} Human-readable narrative text
   */
  static generate(summary) {
    if (!summary || summary.totalVisits === 0) {
      return 'Your journey has yet to begin. The chambers await.';
    }

    const parts = [];

    // Opening — chamber count
    const chamberCount = summary.chambersVisited.length;
    if (chamberCount === 1) {
      const name =
        JourneyNarrative.CHAMBER_NAMES[summary.chambersVisited[0]] ||
        summary.chambersVisited[0];
      parts.push(`You have visited ${name}.`);
    } else {
      parts.push(
        `You have walked through ${chamberCount} chambers.`
      );
    }

    // Lingering — most-visited chamber
    const visitCounts = {};
    for (const v of (summary.pathSequence || [])) {
      visitCounts[v] = (visitCounts[v] || 0) + 1;
    }
    const mostVisited = Object.entries(visitCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (mostVisited && mostVisited[1] > 1) {
      const name =
        JourneyNarrative.CHAMBER_NAMES[mostVisited[0]] || mostVisited[0];
      parts.push(`You lingered in ${name}.`);
    }

    // Interactions — grouped by type
    if (summary.interactions.length > 0) {
      const typeCounts = {};
      for (const i of summary.interactions) {
        const key = `${i.id}:${i.type}`;
        typeCounts[key] = (typeCounts[key] || 0) + 1;
      }

      const topInteraction = Object.entries(typeCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];
      if (topInteraction) {
        const [key, count] = topInteraction;
        const [chamberId, type] = key.split(':');
        const name =
          JourneyNarrative.CHAMBER_NAMES[chamberId] || chamberId;
        const verb =
          JourneyNarrative.INTERACTION_VERBS[type] || type;
        parts.push(`${count > 1 ? count + ' moments ' : 'A moment '}${verb} in ${name}.`);
      }
    }

    // Wings awaiting
    const unvisitedWings = [];
    for (const [wing, chambers] of Object.entries(JourneyNarrative.WINGS)) {
      const visited = chambers.some(c =>
        summary.chambersVisited.includes(c)
      );
      if (!visited) {
        unvisitedWings.push(wing);
      }
    }
    if (unvisitedWings.length > 0 && unvisitedWings.length < 4) {
      parts.push(`The ${unvisitedWings.join(' and ')} await${unvisitedWings.length === 1 ? 's' : ''}.`);
    }

    // Time span
    if (summary.firstVisit && summary.lastVisit) {
      const days = Math.floor(
        (summary.lastVisit - summary.firstVisit) / (1000 * 60 * 60 * 24)
      );
      if (days > 0) {
        parts.push(
          `Your journey spans ${days} day${days === 1 ? '' : 's'}.`
        );
      }
    }

    return parts.join(' ');
  }
}
