import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Palette, ArrowRight } from 'lucide-react';
import Card from '../components/Card';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function ModeSelect() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center min-h-[85vh]"
    >
      <motion.div variants={item} className="text-center mb-12">
        <h1 className="text-headline mb-3">
          What are we building?
        </h1>
        <p className="text-body-lg text-content-secondary max-w-md mx-auto">
          Choose your path. You can always create more profiles later.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5 w-full max-w-3xl">
        <motion.div variants={item}>
          <Card onClick={() => navigate('/lead-gen')} className="group h-full">
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center mb-5 group-hover:bg-brand-purple/20 transition-colors duration-300">
                <Target className="w-6 h-6 text-brand-purple" />
              </div>
              <h2 className="text-title mb-2">Lead Gen</h2>
              <p className="text-content-secondary text-[15px] leading-relaxed mb-5 flex-1">
                Landing pages, ad creatives, email & SMS sequences, CRM integration — all optimized for your industry.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Landing Pages', 'Ad Creatives', 'Email/SMS', 'CRM'].map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-surface-raised text-content-muted font-medium">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-brand-purple text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Get started <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card onClick={() => navigate('/build-brand')} className="group h-full">
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center mb-5 group-hover:bg-brand-purple/20 transition-colors duration-300">
                <Palette className="w-6 h-6 text-brand-purple" />
              </div>
              <h2 className="text-title mb-2">Build a Brand</h2>
              <p className="text-content-secondary text-[15px] leading-relaxed mb-5 flex-1">
                Complete brand identity — logo, website, product mockups, social media, ads, and fulfillment.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Logo', 'Website', 'Mockups', 'Social', 'Ads'].map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-surface-raised text-content-muted font-medium">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-brand-purple text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Get started <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
