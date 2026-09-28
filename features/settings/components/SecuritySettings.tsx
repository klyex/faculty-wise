import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Shield, Lock, Key, ChevronLeft } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export function SecuritySettings() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {isChangingPassword ? "Change Password" : "Account Security"}
            </div>
            {isChangingPassword && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsChangingPassword(false)}
                className="h-8 gap-1 pr-3"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isChangingPassword ? (
            <ChangePasswordForm onCancel={() => setIsChangingPassword(false)} />
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div 
                  onClick={() => setIsChangingPassword(true)}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border bg-surface-alt/20 group hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-white border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text">Change Password</p>
                    <p className="text-xs text-text-muted mt-1">Update your account password regularly to keep it secure.</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-danger">Delete Account</p>
                    <p className="text-xs text-text-muted">Permanently remove your account and all associated data.</p>
                  </div>
                  <Button variant="danger" size="sm" className="px-6">Deactivate</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
