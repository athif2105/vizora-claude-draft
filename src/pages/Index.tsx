// Update this page (the content is just a fallback if you fail to update the page)

import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import VizoraLogo from "@/components/VizoraLogo";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between px-6 py-4">
          <VizoraLogo />
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Funnel Visualization Platform
          </h1>
          <p className="text-xl text-gray-400 mb-10">
            Transform your data into powerful funnel visualizations with Vizora. 
            Track user journeys, identify drop-off points, and optimize your conversion rates.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link to="/funnel">
                Get Started
              </Link>
            </Button>
            
            <Button asChild variant="secondary" size="lg">
              <Link to="/funnel">
                View Demo
              </Link>
            </Button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Visual Analytics</h3>
              <p className="text-gray-400">
                Create beautiful funnel visualizations that clearly show user drop-off at each stage.
              </p>
            </div>
            
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Data Insights</h3>
              <p className="text-gray-400">
                Get detailed breakdowns of user behavior with completion rates and time metrics.
              </p>
            </div>
            
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Easy Integration</h3>
              <p className="text-gray-400">
                Import data with simple CSV uploads and start analyzing immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;