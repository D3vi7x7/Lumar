import type { SubjectData } from '../types';

export const encyclopediaData: Record<string, SubjectData> = {
  physics: {
    title: 'Physics',
    description: 'Explore the fundamental laws of the universe, from the subatomic to the galactic.',
    topics: [
      {
        id: 'solar-system',
        title: 'The Solar System',
        description: 'Our solar system consists of our star, the Sun, and everything bound to it by gravity – the planets Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.',
        subject: 'physics',
        modelType: 'solar-system',
        funFact: 'The Sun accounts for 99.86% of the mass in the solar system.'
      },
      {
        id: 'magnetism',
        title: 'Magnetism',
        description: 'Magnetism is the force exerted by magnets when they attract or repel each other. It is caused by the motion of electric charges. Explore its two key aspects below.',
        subject: 'physics',
        modelType: '',          // parent topic — no model of its own
        funFact: 'Earth itself is a giant magnet with its own magnetic field!',
        subTopics: [
          {
            id: 'magnetic-objects',
            title: 'Magnetic & Non-Magnetic Objects',
            description: 'Not all materials are attracted to magnets. Magnetic materials (like iron and steel) are called ferromagnetic. Non-magnetic materials (like rubber, wood, and plastic) do not respond to magnets. Explore everyday objects and discover which ones a magnet attracts!',
            modelType: 'magnetic-objects',
            funFact: 'Only a few elements — iron, nickel, and cobalt — are naturally magnetic at room temperature.',
            isMagnetic: undefined        // section-level, individual objects have flags
          },
          {
            id: 'magnetic-fields',
            title: 'Magnetic Fields',
            description: 'A magnetic field is the invisible region around a magnet where its force is felt. Field lines flow from the North pole to the South pole outside the magnet, and the lines are closest where the field is strongest.',
            modelType: 'magnet',
            funFact: 'MRI machines in hospitals use extremely powerful magnetic fields — about 60,000 times stronger than the Earth\'s magnetic field!'
          }
        ]
      }
    ]
  },
  chemistry: {
    title: 'Chemistry',
    description: 'Discover the composition, structure, properties, and change of matter.',
    topics: [
      {
        id: 'water-molecule',
        title: 'Water Molecule (H₂O)',
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

/** Objects shown in the Magnetic & Non-Magnetic section */
export const magneticObjects = [
  {
    id: 'nails',
    label: 'Iron Nails',
    modelType: 'nails',
    isMagnetic: true,
    description: 'Iron nails are strongly attracted to magnets. Iron is a ferromagnetic material.'
  },
  {
    id: 'tmtBar',
    label: 'Steel TMT Bar',
    modelType: 'tmtBar',
    isMagnetic: true,
    description: 'Steel reinforcement bars are made of iron alloy and are magnetic.'
  },
  {
    id: 'eraser',
    label: 'Rubber Eraser',
    modelType: 'eraser',
    isMagnetic: false,
    description: 'Rubber is a non-magnetic material. A magnet will not attract an eraser.'
  },
  {
    id: 'rubberDuck',
    label: 'Rubber Duck',
    modelType: 'rubberDuck',
    isMagnetic: false,
    description: 'Plastic and rubber toys are non-magnetic — no attraction to a magnet.'
  },
  {
    id: 'wood',
    label: 'Wooden Stick',
    modelType: 'wood',
    isMagnetic: false,
    description: 'Wood is a non-magnetic material and is not attracted by a magnet.'
  }
];
