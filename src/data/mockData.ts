import type { SubjectData } from '../types';

export const encyclopediaData: Record<string, SubjectData> = {
  physics: {
    title: 'Physics',
    description: 'Explore the fundamental laws of the universe, from the subatomic to the galactic.',
    topics: [
      {
        id: 'solar-system',
        title: 'The Solar System',
        description: 'Our solar system consists of our star, the Sun, and everything bound to it by gravity – the planets Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Watch the planets orbit the central glowing star.',
        subject: 'physics',
        modelType: 'solar-system',
        funFact: 'The Sun accounts for 99.86% of the mass in the solar system.'
      },
      {
        id: 'magnetism',
        title: 'Magnetism',
        description: 'Magnetism is the force exerted by magnets when they attract or repel each other. It is caused by the motion of electric charges.',
        subject: 'physics',
        modelType: 'magnet',
        funFact: 'Earth itself is a giant magnet with its own magnetic field!'
      }
    ]
  },
  chemistry: {
    title: 'Chemistry',
    description: 'Discover the composition, structure, properties, and change of matter.',
    topics: [
      {
        id: 'water-molecule',
        title: 'Water Molecule (H2O)',
        description: 'Water is composed of two hydrogen atoms covalently bonded to one oxygen atom. The unique V-shape of the molecule gives water its amazing properties.',
        subject: 'chemistry',
        modelType: 'h2o',
        funFact: 'Water is the only common substance that exists naturally in all three common states of matter: solid, liquid, and gas.'
      },
      {
        id: 'carbon-atom',
        title: 'Carbon Atom',
        description: 'Carbon is the 6th element in the periodic table. It forms the basis of all known life on Earth. Observe its nucleus with 6 protons and 6 neutrons, surrounded by 6 orbiting electrons.',
        subject: 'chemistry',
        modelType: 'atom',
        funFact: 'A diamond and graphite (pencil lead) are both made entirely of carbon.'
      }
    ]
  }
};
