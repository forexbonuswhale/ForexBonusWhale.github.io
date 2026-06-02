import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 border-l-4 border-primary pl-4">About ForexBonusWhale</h1>
      
      <Card className="bg-card">
        <CardContent className="p-8 prose dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed text-muted-foreground mb-6">
            ForexBonusWhale is your premier destination for discovering, comparing, and tracking the best forex trading bonuses, no-deposit offers, and trading contests across the industry.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We aim to bring transparency to the forex bonus industry. Finding a reliable broker with a genuine bonus offer shouldn't require hours of research and reading through complex terms and conditions. We do the heavy lifting for you, organizing dense financial data into an easily digestible format.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">What We Track</h2>
          <ul className="space-y-4 text-muted-foreground list-disc pl-6 mb-8">
            <li><strong>No Deposit Bonuses:</strong> Risk-free capital to test a broker's platform and conditions before committing your own funds.</li>
            <li><strong>Deposit Bonuses:</strong> Capital multipliers to increase your margin and trading power when you fund your account.</li>
            <li><strong>Trading Contests:</strong> Competitive events where traders can win real cash prizes using demo or live accounts.</li>
          </ul>

          <div className="p-6 bg-primary/10 rounded-lg mt-8 border border-primary/20">
            <h3 className="text-xl font-bold text-primary mb-2">Disclaimer</h3>
            <p className="text-sm text-foreground">
              Trading foreign exchange on margin carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade foreign exchange, you should carefully consider your investment objectives, level of experience, and risk appetite. The information on ForexBonusWhale is for educational purposes only and does not constitute financial advice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
