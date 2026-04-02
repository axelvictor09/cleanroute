import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function Removed() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md animate-fade-in text-center">
                <Card className="border-destructive/50 shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-destructive" />
                        </div>
                        <CardTitle className="font-display text-xl text-destructive text-center">Account Removed</CardTitle>
                        <CardDescription className="text-center">You have been removed by an admin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            Your account access has been revoked. If you believe this is a mistake, please contact support.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link to="/" tabIndex={-1} className="w-full">
                                <Button className="w-full">
                                    Go to Home
                                </Button>
                            </Link>
                            
                            <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-3">Want to register this email as a new account?</p>
                                <Button 
                                    variant="outline"
                                    className="w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400"
                                    onClick={async () => {
                                        if (window.confirm("This will permanently delete your leftover credentials so you can sign up again. Continue?")) {
                                            try {
                                                const { auth } = await import('@/integrations/firebase/client');
                                                const { deleteUser } = await import('firebase/auth');
                                                if (auth.currentUser) {
                                                    await deleteUser(auth.currentUser);
                                                    window.location.href = '/auth?mode=signup';
                                                } else {
                                                    alert("Please sign in first to verify your identity before deleting credentials.");
                                                    window.location.href = '/auth';
                                                }
                                            } catch (err: any) {
                                                if (err.code === 'auth/requires-recent-login') {
                                                    alert("For security reasons, please log in again first, then immediately click this button.");
                                                    window.location.href = '/auth';
                                                } else {
                                                    alert(err.message);
                                                }
                                            }
                                        }
                                    }}
                                >
                                    Delete Leftover Credentials
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
