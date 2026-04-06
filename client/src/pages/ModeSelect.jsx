import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Palette } from 'lucide-react';
import Card from '../components/Card';

export default function ModeSelect() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[80vh]"
    >
      <h1 className="text-4xl font-bold mb-3 text-center">
        What are we building?
      </h1>
      <p className="text-gray-400 text-center mb-10 max-w-md">
        Choose your path. You can always come back and create another profile.
      </p>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Card onClick={() => navigate('/lead-gen')} className="group">
          <div className="p-3 rounded-xl bg-brand-purple/10 text-brand-purple w-fit mb-4 group-hover:bg-brand-purple/20 transition-colors">
            <Target className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Lead Gen</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Build high-converting landing pages, ad creatives, email and SMS
            sequences, and connect your CRM — all optimized for your industry.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Landing Pages', 'Ad Creatives', 'Email/SMS', 'CRM'].map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-brand-dark-surface text-gray-400 border border-brand-dark-border">
                {t}
              </span>
            ))}
          </div>
        </Card>

        <Card onClick={() => navigate('/build-brand')} className="group">
          <div className="p-3 rounded-xl bg-brand-purple/10 text-brand-purple w-fit mb-4 group-hover:bg-brand-purple/20 transition-colors">
            <Palette className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Build a Brand</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Create a complete brand identity — logo, website, product mockups,
            ad creatives, social media, and fulfillment setup.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Logo Design', 'Website', 'Mockups', 'Social', 'Ads'].map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-brand-dark-surface text-gray-400 border border-brand-dark-border">
                {t}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
