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
          },
          {
            id: 'electromagnetism',
            title: 'Electromagnetism',
            description: 'Unlike a permanent magnet (like a fridge magnet), an electromagnet is temporary. By running electricity through a coiled wire wrapped around an iron core, we turn the iron into a powerful magnet. Turn off the electricity, and the magnetism completely disappears. Assemble the solenoid below to understand how!',
            modelType: 'electromagnetism',
            funFact: 'Electromagnets are deeply integrated in everyday technology: doorbells, electric motors, MAGLEV trains, and speakers.'
          },
          {
            id: 'attraction-repulsion',
            title: 'Attraction & Repulsion',
            description: 'Magnets exert forces on each other! When bringing two magnets close together, their magnetic fields interact. Depending on which poles face each other, the invisible magnetic field lines will either pull the magnets tightly together or snap them violently apart.',
            modelType: 'attraction', 
            funFact: 'The repulsion force of extremely powerful magnets is so incredibly strong that it is used to levitate entire MAGLEV trains above the tracks, completely eliminating friction allowing them to travel at over 375 mph!'
          }
        ]
      },
      {
        id: 'light-reflection-shadows',
        title: 'Light, Reflection & Shadows',
        description: 'Light makes the mechanics of vision possible. From illuminating dark rooms to powering plants through photosynthesis, light waves carry massive amounts of energy across space.',
        subject: 'physics',
        modelType: '', // Parent topic
        funFact: 'Sunlight takes about 8 minutes and 20 seconds to travel all the way from the Sun to Earth.',
        subTopics: [
          {
            id: 'light-rays',
            title: 'Light Rays',
            description: 'A light ray is an idealized model of light, drawn as a straight line indicating the path of energy propagation. Explore the emitter below to discover how light inherently travels through the vacuum of space.',
            modelType: 'light-ray',
            funFact: 'Nothing in the universe can travel faster than the speed of light in a vacuum!'
          },
          {
            id: 'reflection',
            title: 'Reflection',
            description: 'When light waves encounter a surface or boundary that does not absorb the energy, it bounces away. Based on the microscopic texture of the surface, reflection can yield crystal clear virtual images or scatter chaotic light in all directions.',
            modelType: 'reflection',
            funFact: 'Mirrors are made by applying a microscopic layer of highly reflective silver or aluminum directly to the back of a perfectly smooth pane of glass!'
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
    description: 'Iron nails are strongly attracted to magnets. Iron is a ferromagnetic material.',
    annotations: [
      'Material Composition: Iron Nails are made of Steel, which is an alloy primarily composed of Iron (Fe).',
      'Magnetic Properties: Iron is a ferromagnetic material. Its internal magnetic "domains" easily align with external magnets.',
      'Interaction: Because the domains align so strongly, the nail gets firmly pulled toward the magnet.'
    ]
  },
  {
    id: 'tmtBar',
    label: 'Steel TMT Bar',
    modelType: 'tmtBar',
    isMagnetic: true,
    description: 'Steel reinforcement bars are made of iron alloy and are magnetic.',
    annotations: [
      'Material Composition: Thermo Mechanically Treated (TMT) bars are made from high-strength structural Steel (Iron & Carbon).',
      'Magnetic Properties: The high iron content makes the steel ferromagnetic.',
      'Interaction: You will notice a strong attractive force pulling the heavy bar toward the magnet.'
    ]
  },
  {
    id: 'eraser',
    label: 'Rubber Eraser',
    modelType: 'eraser',
    isMagnetic: false,
    description: 'Rubber is a non-magnetic material. A magnet will not attract an eraser.',
    annotations: [
      'Material Composition: Erasers are made of natural or synthetic rubber (polymers).',
      'Magnetic Properties: Rubber is non-magnetic. It lacks the special internal electron structure required to interact with magnetic fields.',
      'Interaction: The magnet has zero physical effect on the eraser.'
    ]
  },
  {
    id: 'rubberDuck',
    label: 'Rubber Duck',
    modelType: 'rubberDuck',
    isMagnetic: false,
    description: 'Plastic and rubber toys are non-magnetic — no attraction to a magnet.',
    annotations: [
      'Material Composition: Typically made from PVC plastics or synthetic rubbers.',
      'Magnetic Properties: Plastics are insulators and are completely non-magnetic materials.',
      'Interaction: Placing a magnet near the duck creates no attractive or repulsive force at all.'
    ]
  },
  {
    id: 'wood',
    label: 'Wooden Stick',
    modelType: 'wood',
    isMagnetic: false,
    description: 'Wood is a non-magnetic material and is not attracted by a magnet.',
    annotations: [
      'Material Composition: Wood is composed of organic cellulose and lignin fibers.',
      'Magnetic Properties: Organic carbon-based structures like wood are completely non-magnetic (technically diamagnetic, which means they weakly repel, but too weakly to notice!).',
      'Interaction: The wood remains completely unaffected by the magnet.'
    ]
  },
  {
    id: 'electromagnetism',
    label: 'The Solenoid',
    modelType: 'electromagnetism',
    isMagnetic: true,
    description: 'An electromagnet turns electricity into magnetism.',
    annotations: [
      'The Core: We begin with a solid cylindrical Iron Core sitting freely in space between 2 heavy power units. We selected Iron because it is a strong ferromagnetic material.',
      'The Coil: Next, highly conductive copper wire is vigorously looped around the iron core. A coil of wire like this is called a "Solenoid". The wire connects to the power unit terminals.',
      'Electricity: The power supply activates! Electricity shoots loudly through the copper loops. An electric current intrinsically creates a magnetic field around itself—and winding it into a tight coil enormously concentrates those lines of force!',
      'Interaction: THE ELECTROMAGNET ACTIVATES! The combined power of the focused electricity and the aligned iron core generates a massive, glowing magnetic field, ripping nearby iron nails forcefully into its orbit!'
    ]
  }
];

export const magnetInteractionObjects = [
  {
    id: 'attraction',
    label: 'Magnetic Attraction',
    modelType: 'attraction',
    isMagnetic: true,
    description: 'Opposite poles attract each other.',
    annotations: [
      'Two Magnets: We have two permanent Alnico bar magnets. Magnet A is on the left, and Magnet B is on the right.',
      'Opposites Align: Notice how the South pole of Magnet A faces the North pole of Magnet B. Opposite poles attract each other.',
      'Magnetic Field Interaction: The magnetic field lines (flowing from North to South) perfectly link the two magnets together, creating a unified flow of energy that pulls them toward each other.',
      'Force of Attraction: When released, the magnetic attraction forcefully snaps them together into one unified magnetic structure!'
    ],
    audioNarrations: [
      '/voice/attractionRepulsion/v1.mp3',
      '/voice/attractionRepulsion/v2.mp3',
      '/voice/attractionRepulsion/v3.mp3',
      '/voice/attractionRepulsion/v4.mp3'
    ]
  },
  {
    id: 'repulsion',
    label: 'Magnetic Repulsion',
    modelType: 'repulsion',
    isMagnetic: true,
    description: 'Like poles repel each other.',
    annotations: [
      'Two Magnets: Here are the exact same two permanent Alnico bar magnets. Let\'s see what happens when we flip Magnet B around.',
      'Like Poles Clash: This time, the North pole of Magnet A directly faces the North pole of Magnet B. Like poles violently repel each other.',
      'Magnetic Field Conflict: Examine the magnetic field lines! Because magnetic field lines always flow OUT of the North pole, they violently clash in the middle, squishing together and pushing actively against each other.',
      'Force of Repulsion: The resulting energetic tension creates an invisible wall of force that physically shoves Magnet B backward!'
    ]
  }
];

export const lightRayObjects = [
  {
    id: 'laser-ray',
    label: 'Laser Ray Emission',
    modelType: 'light-ray',
    isMagnetic: false,
    description: 'A functional diagram representing the path and speed of emitted light.',
    annotations: [
      'The Source: All light originates from a source. This high-powered emitter produces an intensely concentrated beam.',
      'Rectilinear Propagation: See the path? Light inherently travels in perfectly straight lines. It will never curve or bend on its own unless it strikes matter or enters a separate medium like water/glass.',
      'Infinity: Unlike physical projectiles (like a tossed ball) which eventually slow down and fall, a light ray traveling through empty space will keep propagating straight ahead forever.',
      'Speed of Light: Light rays are the fastest moving entity in the universe, rocketing at a staggering 299,792,458 meters per second in a vacuum!'
    ]
  }
];

export const reflectionObjects = [
  {
    id: 'reflection-sim',
    label: 'Angles of Reflection',
    modelType: 'reflection',
    isMagnetic: false,
    description: 'A demonstration calculating specular limits, diffuse bounds, and virtual raytracing.',
    annotations: [
      'Specular Reflection: This flat pane is incredibly smooth. When a consolidated photon beam strikes it, it rebounds violently together in a single coordinated beam! The angle the light hits the floor perfectly mirrors the angle it bounces outward.',
      'Diffuse Scattering: The surface texture has decayed! It is now microscopically rocky and uneven. When the coordinated beams impact, they scatter chaotically in a million completely different directions. This is how we see most non-glowing objects in the real world!',
      'Virtual Images (Mirrors): Our brains assume light only travels in straight lines! When you look at perfectly bouncing specular light from a mirror, your brain mathematically traces those bouncing rays backward in a straight line, creating the "Virtual" illusion that the Rubber Duck is physically standing behind the glass!'
    ]
  }
];
