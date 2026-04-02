import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Leaf, MapPin, Truck, BarChart3, ArrowRight, Users, Star, Shield, Smartphone } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const features = [
  { icon: <MapPin aria-hidden="true" className="w-6 h-6" />, title: 'GPS Reporting', desc: 'Auto-detect location and pin waste reports with pinpoint accuracy on interactive maps.' },
  { icon: <Truck aria-hidden="true" className="w-6 h-6" />, title: 'Smart Routes', desc: 'AI-optimized collection routes for maximum efficiency and reduced carbon footprint.' },
  { icon: <BarChart3 aria-hidden="true" className="w-6 h-6" />, title: 'Analytics', desc: 'Real-time dashboards, actionable insights, and ward cleanliness scoring.' },
  { icon: <Users aria-hidden="true" className="w-6 h-6" />, title: 'Community', desc: 'Engage volunteers, earn reward points, and climb the neighborhood leaderboard.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1" aria-label="CleanRoute Home">
            <div className="w-9 h-9 rounded-xl eco-gradient flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow group-hover:scale-105 duration-300">
              <Leaf aria-hidden="true" className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-foreground">Clean Route</span>
          </Link>
          <nav className="flex items-center gap-4" aria-label="Main Navigation">
            <Link to="/auth" tabIndex={-1}>
              <Button variant="ghost" className="hidden sm:flex rounded-full px-6 font-medium hover:bg-primary/10 hover:text-primary transition-colors focus-visible:ring-primary">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=signup" tabIndex={-1}>
              <Button className="eco-gradient text-primary-foreground hover:opacity-90 rounded-full px-6 shadow-md hover:shadow-lg transition-all focus-visible:ring-primary focus-visible:ring-offset-2">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0 bg-secondary/30" aria-hidden="true"></div>
          <div className="absolute inset-0 z-0 opacity-[0.08] mix-blend-overlay" aria-hidden="true">
            <img src={heroBg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 blur-[100px] rounded-full" aria-hidden="true"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 blur-[100px] rounded-full" aria-hidden="true"></div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border shadow-sm text-primary text-sm font-semibold mb-8 animate-fade-in"
                role="status"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Next-Gen Waste Management Platform
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
                Cleaner Cities. <br className="hidden sm:block" />
                <span className="bg-clip-text text-transparent eco-gradient">
                  Smarter Routes.
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Empower your community with interactive waste reporting, sustainable tracking, and AI-optimized collection routes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth" tabIndex={-1}>
                  <Button size="lg" className="h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 focus-visible:ring-primary focus-visible:ring-offset-2">
                    Start Reporting <ArrowRight aria-hidden="true" className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <div tabIndex={-1}>
                  <Button size="lg" variant="outline" className="h-14 rounded-full px-8 text-lg font-semibold bg-background/50 backdrop-blur-sm border-2 border-border hover:bg-accent/10 hover:text-accent-foreground transition-all focus-visible:ring-accent focus-visible:ring-offset-2" onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-16 pt-8 border-t border-border/50 max-w-3xl mx-auto flex flex-wrap justify-center items-center gap-8 text-muted-foreground/80 animate-fade-in">
                <div className="flex items-center gap-2 font-medium">
                  <Shield aria-hidden="true" className="w-5 h-5 text-primary/70" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Smartphone aria-hidden="true" className="w-5 h-5 text-primary/70" />
                  <span>Mobile Friendly</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Star aria-hidden="true" className="w-5 h-5 text-primary/70" />
                  <span>Community Driven</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-card relative z-10 border-y border-border/40">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Our comprehensive platform streamlines waste management from citizen reporting to collection execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group p-8 rounded-3xl border border-border/60 bg-background/50 hover:bg-background shadow-sm hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl eco-gradient flex items-center justify-center text-primary-foreground mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-md">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-3">{f.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
            <Leaf aria-hidden="true" className="w-6 h-6 text-primary" />
            <span className="text-xl font-display font-bold">CleanRoute</span>
          </div>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            © {new Date().getFullYear()} CleanRoute. Built for sustainable routing and a greener tomorrow.
          </p>
        </div>
      </footer>
    </div>
  );
}
