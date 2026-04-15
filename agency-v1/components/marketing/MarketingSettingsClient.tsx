'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Facebook, Search, Link2, Key, Loader2, CheckCircle2, Linkedin, Tv } from "lucide-react";
import { connectFacebookAds } from "@/actions/marketing/facebook-ads";
import { connectGoogleAds } from "@/actions/marketing/google-ads";
import { connectTikTokAds } from "@/actions/marketing/tiktok-ads";
import { connectLinkedInAds } from "@/actions/marketing/linkedin-ads";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

export default function MarketingSettingsClient() {
    const router = useRouter();
    const [isSavingFB, setIsSavingFB] = useState(false);
    const [isSavingGoogle, setIsSavingGoogle] = useState(false);

    // FB State
    const [fbAdAccountId, setFbAdAccountId] = useState('');
    const [fbAccessToken, setFbAccessToken] = useState('');

    // Google State
    const [gCustomerId, setGCustomerId] = useState('');
    const [gDeveloperToken, setGDeveloperToken] = useState('');
    const [gClientId, setGClientId] = useState('');
    const [gClientSecret, setGClientSecret] = useState('');
    const [gRefreshToken, setGRefreshToken] = useState('');

    // TikTok State
    const [isSavingTikTok, setIsSavingTikTok] = useState(false);
    const [tkAdvertiserId, setTkAdvertiserId] = useState('');
    const [tkAccessToken, setTkAccessToken] = useState('');

    // LinkedIn State
    const [isSavingLinkedIn, setIsSavingLinkedIn] = useState(false);
    const [liAccountId, setLiAccountId] = useState('');
    const [liAccessToken, setLiAccessToken] = useState('');

    const handleSaveFacebook = async () => {
        if (!fbAdAccountId || !fbAccessToken) {
            toast.error("Account ID and Access Token are required.");
            return;
        }

        setIsSavingFB(true);
        try {
            await connectFacebookAds(fbAdAccountId, fbAccessToken);
            toast.success("Facebook Ads connected successfully!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to connect Facebook Ads");
        } finally {
            setIsSavingFB(false);
        }
    };

    const handleSaveGoogle = async () => {
        if (!gCustomerId || !gDeveloperToken || !gClientId || !gClientSecret || !gRefreshToken) {
            toast.error("All Google Ads fields are required.");
            return;
        }

        setIsSavingGoogle(true);
        try {
            await connectGoogleAds(gCustomerId, gDeveloperToken, gClientId, gClientSecret, gRefreshToken);
            toast.success("Google Ads connected successfully!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to connect Google Ads");
        } finally {
            setIsSavingGoogle(false);
        }
    };

    const handleSaveTikTok = async () => {
        if (!tkAdvertiserId || !tkAccessToken) {
            toast.error("Advertiser ID and Access Token are required.");
            return;
        }

        setIsSavingTikTok(true);
        try {
            await connectTikTokAds(tkAdvertiserId, tkAccessToken);
            toast.success("TikTok Ads connected successfully!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to connect TikTok Ads");
        } finally {
            setIsSavingTikTok(false);
        }
    };

    const handleSaveLinkedIn = async () => {
        if (!liAccountId || !liAccessToken) {
            toast.error("Account ID and Access Token are required.");
            return;
        }

        setIsSavingLinkedIn(true);
        try {
            await connectLinkedInAds(liAccountId, liAccessToken);
            toast.success("LinkedIn Ads connected successfully!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to connect LinkedIn Ads");
        } finally {
            setIsSavingLinkedIn(false);
        }
    };

    return (
        <Tabs defaultValue="facebook" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-[800px] mb-8">
                <TabsTrigger value="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Meta Ads
                </TabsTrigger>
                <TabsTrigger value="google" className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-emerald-600" />
                    Google Ads
                </TabsTrigger>
                <TabsTrigger value="tiktok" className="flex items-center gap-2">
                    <Tv className="h-4 w-4 text-black" />
                    TikTok Ads
                </TabsTrigger>
                <TabsTrigger value="linkedin" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-sky-700" />
                    LinkedIn Ads
                </TabsTrigger>
            </TabsList>

            <TabsContent value="facebook">
                <Card className="max-w-[600px] border-blue-100 shadow-md">
                    <CardHeader className="bg-blue-50/50 rounded-t-xl border-b border-blue-100 pb-6">
                        <CardTitle className="text-xl flex items-center gap-2 text-blue-800">
                            <Facebook className="h-5 w-5" />
                            Meta Marketing API
                        </CardTitle>
                        <CardDescription className="text-blue-600/80">
                            Connect your Facebook Business Manager to pull live campaigns and spend data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="fbAccountId" className="font-bold flex items-center gap-2"><Key className="h-3 w-3" /> Ad Account ID</Label>
                            <Input
                                id="fbAccountId"
                                placeholder="act_1234567890"
                                value={fbAdAccountId}
                                onChange={(e) => setFbAdAccountId(e.target.value)}
                                className="font-mono bg-gray-50"
                            />
                            <p className="text-xs text-muted-foreground">The numeric ID of your Ad Account (with or without 'act_' prefix).</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fbToken" className="font-bold flex items-center gap-2"><Link2 className="h-3 w-3" /> System User Access Token</Label>
                            <Input
                                id="fbToken"
                                type="password"
                                placeholder="EAAB..."
                                value={fbAccessToken}
                                onChange={(e) => setFbAccessToken(e.target.value)}
                                className="font-mono bg-gray-50"
                            />
                            <p className="text-xs text-muted-foreground">A permanent access token generated from your Meta Developer App.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 rounded-b-xl border-t px-6 py-4 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Data is encrypted before saving.
                        </p>
                        <Button onClick={handleSaveFacebook} disabled={isSavingFB} className="bg-blue-600 hover:bg-blue-700">
                            {isSavingFB && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Connect Meta Ads
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="google">
                <Card className="max-w-[600px] border-emerald-100 shadow-md">
                    <CardHeader className="bg-emerald-50/50 rounded-t-xl border-b border-emerald-100 pb-6">
                        <CardTitle className="text-xl flex items-center gap-2 text-emerald-800">
                            <Search className="h-5 w-5" />
                            Google Ads API
                        </CardTitle>
                        <CardDescription className="text-emerald-600/80">
                            Connect your Google Ads account using OAuth 2.0 Desktop or Web App credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gCustomerId" className="font-bold text-xs">Customer ID (MCC or Direct)</Label>
                                <Input
                                    id="gCustomerId"
                                    placeholder="123-456-7890"
                                    value={gCustomerId}
                                    onChange={(e) => setGCustomerId(e.target.value)}
                                    className="font-mono bg-gray-50 h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gDevToken" className="font-bold text-xs">Developer Token</Label>
                                <Input
                                    id="gDevToken"
                                    type="password"
                                    placeholder="abcXYZ123..."
                                    value={gDeveloperToken}
                                    onChange={(e) => setGDeveloperToken(e.target.value)}
                                    className="font-mono bg-gray-50 h-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                            <Label htmlFor="gClientId" className="font-bold text-xs">OAuth Client ID</Label>
                            <Input
                                id="gClientId"
                                placeholder="xxx.apps.googleusercontent.com"
                                value={gClientId}
                                onChange={(e) => setGClientId(e.target.value)}
                                className="font-mono bg-gray-50 h-9"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gClientSecret" className="font-bold text-xs">OAuth Client Secret</Label>
                            <Input
                                id="gClientSecret"
                                type="password"
                                placeholder="..."
                                value={gClientSecret}
                                onChange={(e) => setGClientSecret(e.target.value)}
                                className="font-mono bg-gray-50 h-9"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gRefreshToken" className="font-bold text-xs">Refresh Token</Label>
                            <Input
                                id="gRefreshToken"
                                type="password"
                                placeholder="1//0e..."
                                value={gRefreshToken}
                                onChange={(e) => setGRefreshToken(e.target.value)}
                                className="font-mono bg-gray-50 h-9"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 rounded-b-xl border-t px-6 py-4 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Secure OAuth Storage via Prisma.
                        </p>
                        <Button onClick={handleSaveGoogle} disabled={isSavingGoogle} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSavingGoogle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Connect Google Ads
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="tiktok">
                <Card className="max-w-[600px] border-gray-200 shadow-md">
                    <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-200 pb-6">
                        <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                            <Tv className="h-5 w-5" />
                            TikTok Business API
                        </CardTitle>
                        <CardDescription className="text-gray-600/80">
                            Connect your TikTok Ads Manager to pull live campaigns.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="tkAdvertiserId" className="font-bold flex items-center gap-2"><Key className="h-3 w-3" /> Advertiser ID</Label>
                            <Input
                                id="tkAdvertiserId"
                                placeholder="1234567890"
                                value={tkAdvertiserId}
                                onChange={(e) => setTkAdvertiserId(e.target.value)}
                                className="font-mono bg-gray-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tkToken" className="font-bold flex items-center gap-2"><Link2 className="h-3 w-3" /> Access Token</Label>
                            <Input
                                id="tkToken"
                                type="password"
                                placeholder="eyJ..."
                                value={tkAccessToken}
                                onChange={(e) => setTkAccessToken(e.target.value)}
                                className="font-mono bg-gray-50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 rounded-b-xl border-t px-6 py-4 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Data is encrypted.
                        </p>
                        <Button onClick={handleSaveTikTok} disabled={isSavingTikTok} className="bg-black hover:bg-gray-800 text-white">
                            {isSavingTikTok && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Connect TikTok Ads
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="linkedin">
                <Card className="max-w-[600px] border-sky-100 shadow-md">
                    <CardHeader className="bg-sky-50/50 rounded-t-xl border-b border-sky-100 pb-6">
                        <CardTitle className="text-xl flex items-center gap-2 text-sky-800">
                            <Linkedin className="h-5 w-5" />
                            LinkedIn Marketing API
                        </CardTitle>
                        <CardDescription className="text-sky-600/80">
                            Connect your LinkedIn Campaign Manager.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="liAccountId" className="font-bold flex items-center gap-2"><Key className="h-3 w-3" /> Ad Account ID</Label>
                            <Input
                                id="liAccountId"
                                placeholder="urn:li:sponsoredAccount:123456"
                                value={liAccountId}
                                onChange={(e) => setLiAccountId(e.target.value)}
                                className="font-mono bg-gray-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="liToken" className="font-bold flex items-center gap-2"><Link2 className="h-3 w-3" /> Access Token</Label>
                            <Input
                                id="liToken"
                                type="password"
                                placeholder="AQW..."
                                value={liAccessToken}
                                onChange={(e) => setLiAccessToken(e.target.value)}
                                className="font-mono bg-gray-50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 rounded-b-xl border-t px-6 py-4 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Secure OAuth Storage.
                        </p>
                        <Button onClick={handleSaveLinkedIn} disabled={isSavingLinkedIn} className="bg-sky-700 hover:bg-sky-800 text-white">
                            {isSavingLinkedIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Connect LinkedIn Ads
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
