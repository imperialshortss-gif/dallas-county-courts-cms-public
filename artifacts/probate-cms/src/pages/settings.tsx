import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, ShieldAlert, Database } from "lucide-react";

export default function Settings() {
  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global court parameters and system preferences.</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
            <TabsTrigger value="general"><Building2 className="h-4 w-4 mr-2" /> General</TabsTrigger>
            <TabsTrigger value="notifications"><Mail className="h-4 w-4 mr-2" /> Notices</TabsTrigger>
            <TabsTrigger value="security"><ShieldAlert className="h-4 w-4 mr-2" /> Security</TabsTrigger>
            <TabsTrigger value="integrations"><Database className="h-4 w-4 mr-2" /> Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Court Information</CardTitle>
                <CardDescription>
                  Official details used on all generated documents and notices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="court-name">Official Court Name</Label>
                    <Input id="court-name" defaultValue="Statutory Probate Courts – Dallas County" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction">Jurisdiction</Label>
                    <Input id="jurisdiction" defaultValue="Dallas County, Texas" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Physical Address</Label>
                  <Input id="address" defaultValue="1200 Main St, Dallas, TX 75202" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Clerk Phone</Label>
                    <Input id="phone" defaultValue="(214) 653-7099" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Official Email</Label>
                    <Input id="email" defaultValue="probate.clerk@dallascounty.org" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/30 px-6 py-4">
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>
                  Global formatting and display settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-generate Case Numbers</Label>
                    <p className="text-sm text-muted-foreground">Automatically assign the next sequential case number upon filing.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Electronic Filing</Label>
                    <p className="text-sm text-muted-foreground">Mandate documents to be uploaded for all new cases.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholders for other tabs to show completeness */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notice Templates</CardTitle>
                <CardDescription>Configure automated mailing templates.</CardDescription>
              </CardHeader>
              <CardContent className="h-32 flex items-center justify-center text-muted-foreground">
                Template editor functionality coming soon.
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Policies</CardTitle>
                <CardDescription>Session and access control settings.</CardDescription>
              </CardHeader>
              <CardContent className="h-32 flex items-center justify-center text-muted-foreground">
                Security settings panel.
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Backup and archive settings.</CardDescription>
              </CardHeader>
              <CardContent className="h-32 flex items-center justify-center text-muted-foreground">
                Data management panel.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
