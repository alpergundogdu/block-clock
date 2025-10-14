import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar, Hash, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AVERAGE_BLOCK_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const GENESIS_BLOCK_TIMESTAMP = 1231006505000; // Bitcoin genesis block timestamp

type NetworkType = "mainnet" | "signet";

export const BlockCalculator = () => {
  const [network, setNetwork] = useState<NetworkType>("mainnet");
  const [currentBlockHeight, setCurrentBlockHeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Date to Block states
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [calculatedBlock, setCalculatedBlock] = useState<number | null>(null);
  
  // Block to Date states
  const [blockInput, setBlockInput] = useState("");
  const [calculatedDate, setCalculatedDate] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentBlock();
  }, [network]);

  const fetchCurrentBlock = async () => {
    setLoading(true);
    try {
      const baseUrl = network === "mainnet" 
        ? "https://mempool.space/api" 
        : "https://mempool.space/signet/api";
      
      const response = await fetch(`${baseUrl}/blocks/tip/height`);
      const height = await response.json();
      setCurrentBlockHeight(height);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch current block height",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBlockFromDate = () => {
    if (!dateInput || !timeInput || !currentBlockHeight) {
      toast({
        title: "Missing input",
        description: "Please enter both date and time",
        variant: "destructive",
      });
      return;
    }

    const targetDate = new Date(`${dateInput}T${timeInput}`);
    const targetTimestamp = targetDate.getTime();
    const currentTimestamp = Date.now();
    
    if (targetTimestamp > currentTimestamp) {
      // Future date
      const timeDiff = targetTimestamp - currentTimestamp;
      const blocksDiff = Math.round(timeDiff / AVERAGE_BLOCK_TIME);
      setCalculatedBlock(currentBlockHeight + blocksDiff);
    } else {
      // Past date
      const timeDiff = currentTimestamp - targetTimestamp;
      const blocksDiff = Math.round(timeDiff / AVERAGE_BLOCK_TIME);
      const estimatedBlock = currentBlockHeight - blocksDiff;
      setCalculatedBlock(Math.max(0, estimatedBlock));
    }
  };

  const calculateDateFromBlock = () => {
    if (!blockInput || !currentBlockHeight) {
      toast({
        title: "Missing input",
        description: "Please enter a block height",
        variant: "destructive",
      });
      return;
    }

    const targetBlock = parseInt(blockInput);
    const blockDiff = targetBlock - currentBlockHeight;
    const timeDiff = blockDiff * AVERAGE_BLOCK_TIME;
    const estimatedDate = new Date(Date.now() + timeDiff);
    
    setCalculatedDate(estimatedDate.toLocaleString());
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Bitcoin Block Calculator
          </h1>
          <p className="text-muted-foreground">
            Convert between block heights and timestamps
          </p>
        </div>

        {/* Network Selector Card */}
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-primary" />
              <div>
                <Label className="text-foreground font-medium">Network</Label>
                <p className="text-sm text-muted-foreground">
                  Current block: {loading ? "Loading..." : currentBlockHeight?.toLocaleString() || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className={network === "mainnet" ? "text-foreground" : "text-muted-foreground"}>
                Mainnet
              </Label>
              <Switch
                checked={network === "signet"}
                onCheckedChange={(checked) => setNetwork(checked ? "signet" : "mainnet")}
              />
              <Label className={network === "signet" ? "text-foreground" : "text-muted-foreground"}>
                Signet
              </Label>
            </div>
          </div>
        </Card>

        {/* Calculator Tabs */}
        <Tabs defaultValue="date-to-block" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="date-to-block" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Date to Block
            </TabsTrigger>
            <TabsTrigger value="block-to-date" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Hash className="w-4 h-4 mr-2" />
              Block to Date
            </TabsTrigger>
          </TabsList>

          <TabsContent value="date-to-block">
            <Card className="p-6 bg-gradient-card border-border space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-foreground">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-foreground">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <Button 
                onClick={calculateBlockFromDate}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
              >
                Calculate Block Height
              </Button>
              {calculatedBlock !== null && (
                <div className="mt-4 p-4 bg-background rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Block Height</p>
                  <p className="text-3xl font-bold text-primary">{calculatedBlock.toLocaleString()}</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="block-to-date">
            <Card className="p-6 bg-gradient-card border-border space-y-4">
              <div className="space-y-2">
                <Label htmlFor="block" className="text-foreground">Block Height</Label>
                <Input
                  id="block"
                  type="number"
                  placeholder="Enter block height"
                  value={blockInput}
                  onChange={(e) => setBlockInput(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <Button 
                onClick={calculateDateFromBlock}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
              >
                Calculate Date & Time
              </Button>
              {calculatedDate && (
                <div className="mt-4 p-4 bg-background rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Date & Time</p>
                  <p className="text-2xl font-bold text-primary">{calculatedDate}</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="p-4 bg-secondary/50 border-border">
          <p className="text-sm text-muted-foreground text-center">
            Calculations are based on an average block time of 10 minutes. Actual times may vary.
          </p>
        </Card>
      </div>
    </div>
  );
};
