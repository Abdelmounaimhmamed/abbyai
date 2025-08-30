import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Key,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Copy,
} from "lucide-react";
import { APIKeyConfig } from "@shared/types";
import { adminApi } from "@/lib/api";

export default function APIKeys() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState(false);

  // AI Configuration state
  const [aiConfig, setAiConfig] = useState({
    modelName: "gpt-3.5-turbo",
    apiKey: "",
    provider: "openai"
  });
  const [showAiConfigDialog, setShowAiConfigDialog] = useState(false);
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  // Fetch API keys and AI configuration data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch API keys
        const response = await adminApi.getAPIKeys();
        setApiKeys(response.apiKeys || []);

        // Load AI configuration from localStorage for now
        // In a real implementation, this would come from the database
        const savedConfig = localStorage.getItem('ai_config');
        if (savedConfig) {
          setAiConfig(JSON.parse(savedConfig));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApiKeyToggle = async (keyId: string) => {
    try {
      const currentKey = apiKeys.find(k => k.id === keyId);
      if (!currentKey) return;

      await adminApi.updateAPIKey(keyId, { isActive: !currentKey.isActive });

      // Update local state
      setApiKeys((prev) =>
        prev.map((key) => {
          if (key.id === keyId) {
            return { ...key, isActive: !key.isActive };
          } else if (!key.isActive) {
            return key;
          } else {
            return { ...key, isActive: false };
          }
        }),
      );
    } catch (error) {
      console.error('Failed to toggle API key:', error);
      setError('Failed to update API key. Please try again.');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await adminApi.deleteAPIKey(keyId);
      setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
    } catch (error) {
      console.error('Failed to delete API key:', error);
      setError('Failed to delete API key. Please try again.');
    }
  };

  const handleAddKey = async () => {
    if (!newKeyName.trim()) return;
    if (addingKey) return;

    try {
      setAddingKey(true);
      setError(null);

      const keyData = {
        name: newKeyName,
        permissions: ["ai_chat"] // Default permission for chat functionality
      };

      const response = await adminApi.createAPIKey(keyData);

      // Add new key to list
      setApiKeys(prev => [response.keyInfo, ...prev]);

      // Reset form and close dialog
      setNewKeyName("");
      setNewKeyValue("");
      setShowAddDialog(false);

      // Show the generated API key to the user
      alert(`API Key created successfully! \n\nKey: ${response.apiKey}\n\n⚠️ This is the only time you'll see the full key. Please copy it now!`);
    } catch (error: any) {
      console.error('Failed to create API key:', error);
      setError(error.message || 'Failed to create API key. Please try again.');
    } finally {
      setAddingKey(false);
    }
  };

  const handleCopyKey = (keyId: string, keyPreview: string) => {
    // Only copy the preview since we don't have access to the full key
    navigator.clipboard.writeText(keyPreview);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKey(showKey === keyId ? null : keyId);
  };

  const handleSaveAiConfig = async () => {
    if (savingAiConfig) return;

    try {
      setSavingAiConfig(true);
      setError(null);

      // For now, save to localStorage
      // In a real implementation, this would save to the database
      localStorage.setItem('ai_config', JSON.stringify(aiConfig));

      setShowAiConfigDialog(false);

      // Show success message
      alert('AI configuration saved successfully!');
    } catch (error: any) {
      console.error('Failed to save AI configuration:', error);
      setError(error.message || 'Failed to save AI configuration. Please try again.');
    } finally {
      setSavingAiConfig(false);
    }
  };

  const activeKey = apiKeys.find((key) => key.isActive);
  const totalUsage = apiKeys.reduce((sum, key) => sum + (key.usageCount || 0), 0);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading API keys...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error && apiKeys.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                API Configuration
              </h1>
              <p className="text-muted-foreground">
                Configure AI models and manage platform API keys
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <div className="flex space-x-2">
                  <Dialog open={showAiConfigDialog} onOpenChange={setShowAiConfigDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Key className="w-4 h-4 mr-2" />
                        Configure AI
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>AI Model Configuration</DialogTitle>
                        <DialogDescription>
                          Configure the AI model and API key for chat functionality
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="provider">AI Provider</Label>
                          <select
                            id="provider"
                            value={aiConfig.provider}
                            onChange={(e) => setAiConfig(prev => ({ ...prev, provider: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="openai">OpenAI</option>
                            <option value="cohere">Cohere</option>
                            <option value="anthropic">Anthropic</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="modelName">Model Name</Label>
                          <Input
                            id="modelName"
                            value={aiConfig.modelName}
                            onChange={(e) => setAiConfig(prev => ({ ...prev, modelName: e.target.value }))}
                            placeholder="e.g., gpt-3.5-turbo, command-r, claude-3-sonnet"
                          />
                        </div>

                        <div>
                          <Label htmlFor="aiApiKey">API Key</Label>
                          <Input
                            id="aiApiKey"
                            type="password"
                            value={aiConfig.apiKey}
                            onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder="Enter your AI provider API key"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={handleSaveAiConfig}
                            disabled={!aiConfig.modelName.trim() || !aiConfig.apiKey.trim() || savingAiConfig}
                          >
                            {savingAiConfig ? "Saving..." : "Save Configuration"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAiConfigDialog(false);
                              setError(null);
                            }}
                            disabled={savingAiConfig}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button className="bg-abby-blue hover:bg-abby-blue/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate API Key
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for platform access. The key will be shown only once after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="keyName">Key Name *</Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production Key, Development Key"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAddKey}
                      disabled={!newKeyName.trim() || addingKey}
                    >
                      {addingKey ? "Generating..." : "Generate Key"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddDialog(false);
                        setNewKeyName("");
                        setError(null);
                      }}
                      disabled={addingKey}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-abby-blue" />
                  <span className="text-sm font-medium">Total Keys</span>
                </div>
                <div className="text-2xl font-bold text-abby-blue mt-2">
                  {apiKeys.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Active Key</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {activeKey ? "1" : "0"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Total Usage</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-2">
                  {totalUsage.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mt-2">
                  {activeKey ? "ACTIVE" : "INACTIVE"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Key Alert */}
          {activeKey && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-900">
                      Active API Key
                    </h4>
                    <p className="text-sm text-green-700">
                      <strong>{activeKey.name}</strong> is currently active and
                      being used for all AI sessions. Last used:{" "}
                      {activeKey.lastUsed
                        ? new Date(activeKey.lastUsed).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!activeKey && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="font-semibold text-red-900">
                      No Active Platform API Key
                    </h4>
                    <p className="text-sm text-red-700">
                      No platform API key is currently active. External integrations will not work
                      until you activate a key.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Configuration Status */}
          <Card className={`${aiConfig.apiKey && aiConfig.modelName ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                {aiConfig.apiKey && aiConfig.modelName ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <h4 className={`font-semibold ${aiConfig.apiKey && aiConfig.modelName ? 'text-green-900' : 'text-yellow-900'}`}>
                    AI Configuration Status
                  </h4>
                  {aiConfig.apiKey && aiConfig.modelName ? (
                    <div className="text-sm text-green-700">
                      <p><strong>Provider:</strong> {aiConfig.provider}</p>
                      <p><strong>Model:</strong> {aiConfig.modelName}</p>
                      <p><strong>API Key:</strong> Configured</p>
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-700">
                      AI configuration is incomplete. Please configure the model and API key for AI chat functionality.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys List */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your Cohere API keys. Only one key can be active at a
                time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      key.isActive
                        ? "border-green-200 bg-green-50"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${key.isActive ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      <div>
                        <div className="font-medium">{key.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <span className="font-mono">
                            {showKey === key.id
                              ? key.keyPreview || "abby_***"
                              : key.keyPreview || "abby_***"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showKey === key.id ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleCopyKey(
                                key.id,
                                key.keyPreview || "abby_***",
                              )
                            }
                            className="h-6 w-6 p-0"
                            title="Copy key preview"
                          >
                            {copiedKey === key.id ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created:{" "}
                          {new Date(key.createdAt).toLocaleDateString()} •
                          Usage: {(key.usageCount || 0).toLocaleString()} calls
                          {key.lastUsedAt &&
                            ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </div>
                        {key.permissions && key.permissions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {key.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={key.isActive ? "default" : "secondary"}>
                        {key.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={key.isActive ? "destructive" : "default"}
                        onClick={() => handleApiKeyToggle(key.id)}
                      >
                        {key.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteKey(key.id)}
                        disabled={key.isActive}
                        title={key.isActive ? "Cannot delete active key" : "Delete key"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {apiKeys.length === 0 && (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">
                      No API Keys
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first Cohere API key to enable AI functionality
                    </p>
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add API Key
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Platform API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">About API Keys</h4>
                  <p className="text-sm text-muted-foreground">
                    These API keys provide programmatic access to the Abby Therapy platform.
                    They can be used to integrate external applications or services with the platform.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Features</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Secure authentication for API access</li>
                    <li>Usage tracking and monitoring</li>
                    <li>Permission-based access control</li>
                    <li>Easy activation/deactivation</li>
                  </ul>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> API keys are shown in full only once upon creation.
                    Make sure to copy and store them securely. Lost keys cannot be recovered and must be regenerated.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Security:</strong> Never share your API keys publicly or commit them to version control.
                    Use environment variables or secure configuration management for production usage.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
