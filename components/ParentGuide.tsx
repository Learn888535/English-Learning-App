import React from 'react';

const ParentGuide: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white/95 backdrop-blur-sm p-2 rounded-xl border border-slate-100 z-10">
        <button onClick={onBack} className="bg-slate-100 p-2 rounded-full shadow-sm text-sm font-bold text-slate-600">← Back (返回)</button>
        <h2 className="text-lg font-bold text-slate-800">For Parents: How Kids Learn</h2>
      </div>

      <Section title="Part 1: The Natural Process">
        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <span className="font-bold text-yellow-600 block">The Silent Period (Input Phase)</span>
            <p>Before they speak, they listen. They are absorbing sounds and vocabulary. Do not force them to speak during this time; they are "downloading" the language.</p>
          </div>
          <div>
            <span className="font-bold text-blue-600 block">Imitation (Copying)</span>
            <p>They begin to mimic sounds and single words they hear most often (e.g., "ball," "milk").</p>
          </div>
          <div>
            <span className="font-bold text-green-600 block">Construction (Building)</span>
            <p>They start combining words into simple phrases ("Mommy go," "Blue car") and eventually full sentences.</p>
          </div>
          <div>
             <span className="font-bold text-purple-600 block">Refinement</span>
             <p>Through constant use and listening, they naturally self-correct grammar and pronunciation over time.</p>
          </div>
        </div>
      </Section>

      <Section title="Part 2: Actionable Strategies">
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
          <li><strong>Narrate Your Day:</strong> Act like a sportscaster. "I am washing the plate. The water is warm."</li>
          <li><strong>Label the House:</strong> Put sticky notes on objects (Door, Table, Fridge).</li>
          <li><strong>Routine:</strong> Use the same phrases: "It’s time to brush your teeth."</li>
          <li><strong>Read Daily:</strong> Picture walks (look at pics first) and Repetition (reading the same book 50 times is good!).</li>
        </ul>
      </Section>

      <Section title="Part 3: Correcting Mistakes (The 'Sandwich' Method)">
        <p className="text-sm text-slate-600 mb-2">If a child says, "I goed to the park," do not say, "No, that is wrong." This kills confidence.</p>
        <p className="text-sm text-slate-600 mb-2 font-bold">Instead, use Recasting:</p>
        
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm space-y-2">
          <p className="text-slate-500">Child: "I goed to the park."</p>
          <div className="flex gap-2">
             <span className="text-2xl">🥪</span>
             <div>
                <p className="text-green-700 font-bold">You: "Oh, you went to the park? That's fun!"</p>
                <p className="text-xs text-yellow-700 mt-1">1. Acknowledge (Top Bun) <br/> 2. Correct naturally (Meat) <br/> 3. Continue chat (Bottom Bun)</p>
             </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
    <h3 className="font-bold text-slate-800 mb-3 border-b pb-2 border-slate-100">{title}</h3>
    {children}
  </div>
);

export default ParentGuide;