// Script de test pour valider toutes les APIs
import { API_CONFIG } from '@/lib/api-config';
import { SecureStorage } from '@/lib/secure-storage';

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface TestSuite {
  name: string;
  results: ApiTestResult[];
  passed: number;
  failed: number;
  total: number;
}

class ApiTester {
  private baseUrl = API_CONFIG.BASE_URL;
  private authToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.authToken = SecureStorage.getItem('authToken');
    }
  }

  private getHeaders(includeAuth: boolean = true, isFormData: boolean = false): HeadersInit {
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (includeAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  private async makeRequest(
    endpoint: string, 
    method: string = 'GET', 
    body?: any,
    requireAuth: boolean = true,
    isFormData: boolean = false
  ): Promise<ApiTestResult> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: this.getHeaders(requireAuth, isFormData),
      };

      if (body && method !== 'GET') {
        options.body = isFormData ? body : JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      return {
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        message: data.message || data.status || 'OK',
        data: data
      };
    } catch (error) {
      return {
        endpoint,
        method,
        status: 0,
        success: false,
        message: 'Connection Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Test des APIs de monitoring
  async testMonitoringApis(): Promise<TestSuite> {
    const results: ApiTestResult[] = [];

    // Test health endpoint
    results.push(await this.makeRequest('/health', 'GET', null, false));
    
    // Test sessions health
    results.push(await this.makeRequest('/api/sessions/health', 'GET', null, false));
    
    // Test sessions stats
    results.push(await this.makeRequest('/api/sessions/stats', 'GET', null, false));

    return this.createTestSuite('Monitoring APIs', results);
  }

  // Test des APIs d'authentification
  async testAuthApis(): Promise<TestSuite> {
    const results: ApiTestResult[] = [];

    // Test login endpoint structure (sans credentials valides)
    results.push(await this.makeRequest('/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'wrongpassword'
    }, false));

    // Test logout endpoint
    if (this.authToken) {
      results.push(await this.makeRequest('/auth/logout', 'POST', {}));
    }

    return this.createTestSuite('Authentication APIs', results);
  }

  // Test des APIs CRUD principales
  async testCrudApis(): Promise<TestSuite> {
    const results: ApiTestResult[] = [];

    if (!this.authToken) {
      results.push({
        endpoint: 'CRUD Tests',
        method: 'SKIP',
        status: 401,
        success: false,
        message: 'No auth token available for CRUD tests'
      });
      return this.createTestSuite('CRUD APIs', results);
    }

    // Test projects getByCriteria
    results.push(await this.makeRequest('/projects/getByCriteria', 'POST', {
      index: 0,
      size: 5,
      data: { is_active: true }
    }));

    // Test partners getByCriteria
    results.push(await this.makeRequest('/partners/getByCriteria', 'POST', {
      index: 0,
      size: 5,
      data: { is_active: true }
    }));

    // Test files getByCriteria
    results.push(await this.makeRequest('/files/getByCriteria', 'POST', {
      index: 0,
      size: 5,
      data: {}
    }));

    // Test folders getByCriteria
    results.push(await this.makeRequest('/folders/getByCriteria', 'POST', {
      index: 0,
      size: 5,
      data: {}
    }));

    // Test users getByCriteria
    results.push(await this.makeRequest('/users/getByCriteria', 'POST', {
      index: 0,
      size: 5,
      data: { is_active: true }
    }));

    // Test incidents getByCriteria
    results.push(await this.makeRequest('/incidents/getByCriteria', 'POST', {
      index: 0,
      size: 5,
      data: {}
    }));

    return this.createTestSuite('CRUD APIs', results);
  }

  // Test des APIs de messages et communication
  async testMessagesApis(): Promise<TestSuite> {
    const results: ApiTestResult[] = [];

    if (!this.authToken) {
      results.push({
        endpoint: 'Messages Tests',
        method: 'SKIP',
        status: 401,
        success: false,
        message: 'No auth token available for Messages tests'
      });
      return this.createTestSuite('Messages APIs', results);
    }

    // Test messages/my-messages
    results.push(await this.makeRequest('/messages/my-messages', 'POST', {
      index: 0,
      size: 10
    }));

    // Test support/requests
    results.push(await this.makeRequest('/support/requests', 'POST', {
      index: 0,
      size: 10,
      data: {}
    }));

    // Test notifications/unread
    results.push(await this.makeRequest('/notifications/unread', 'POST', {
      index: 0,
      size: 10
    }));

    return this.createTestSuite('Messages APIs', results);
  }

  // Test des APIs FCM
  async testFcmApis(): Promise<TestSuite> {
    const results: ApiTestResult[] = [];

    if (!this.authToken) {
      results.push({
        endpoint: 'FCM Tests',
        method: 'SKIP',
        status: 401,
        success: false,
        message: 'No auth token available for FCM tests'
      });
      return this.createTestSuite('FCM APIs', results);
    }

    // Test FCM register token (sans token valide)
    results.push(await this.makeRequest('/fcm/register-token', 'POST', {
      fcm_token: 'test_token_invalid'
    }));

    // Test FCM test notification
    results.push(await this.makeRequest('/fcm/test-notification', 'POST', {
      title: 'Test',
      body: 'Test notification'
    }));

    return this.createTestSuite('FCM APIs', results);
  }

  // Test des APIs Dashboard
  async testDashboardApis(): Promise<TestSuite> {
    const results: ApiTestResult[] = [];

    if (!this.authToken) {
      results.push({
        endpoint: 'Dashboard Tests',
        method: 'SKIP',
        status: 401,
        success: false,
        message: 'No auth token available for Dashboard tests'
      });
      return this.createTestSuite('Dashboard APIs', results);
    }

    // Test dashboard admin overview
    results.push(await this.makeRequest('/dashboard/admin/overview', 'GET'));

    // Test dashboard partner (ID de test)
    results.push(await this.makeRequest('/dashboard/partner/1', 'GET'));

    return this.createTestSuite('Dashboard APIs', results);
  }

  // Créer un suite de test
  private createTestSuite(name: string, results: ApiTestResult[]): TestSuite {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      name,
      results,
      passed,
      failed,
      total: results.length
    };
  }

  // Exécuter tous les tests
  async runAllTests(): Promise<{
    suites: TestSuite[];
    summary: {
      totalSuites: number;
      totalTests: number;
      totalPassed: number;
      totalFailed: number;
      successRate: number;
    };
  }> {
    console.log('🚀 Démarrage des tests API...');
    
    const suites: TestSuite[] = [];

    // Exécuter tous les suites de tests
    suites.push(await this.testMonitoringApis());
    suites.push(await this.testAuthApis());
    suites.push(await this.testCrudApis());
    suites.push(await this.testMessagesApis());
    suites.push(await this.testFcmApis());
    suites.push(await this.testDashboardApis());

    // Calculer le résumé
    const totalTests = suites.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = suites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = suites.reduce((sum, suite) => sum + suite.failed, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const summary = {
      totalSuites: suites.length,
      totalTests,
      totalPassed,
      totalFailed,
      successRate: Math.round(successRate * 100) / 100
    };

    console.log('✅ Tests terminés:', summary);
    
    return { suites, summary };
  }

  // Afficher les résultats dans la console
  logResults(suites: TestSuite[]): void {
    suites.forEach(suite => {
      console.group(`📋 ${suite.name} (${suite.passed}/${suite.total} réussis)`);
      
      suite.results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        const statusColor = result.success ? 'color: green' : 'color: red';
        
        console.log(
          `%c${icon} ${result.method} ${result.endpoint} - ${result.status} - ${result.message}`,
          statusColor
        );
        
        if (result.error) {
          console.error(`   Error: ${result.error}`);
        }
      });
      
      console.groupEnd();
    });
  }
}

export const apiTester = new ApiTester();
export type { ApiTestResult, TestSuite };