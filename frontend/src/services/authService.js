//const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
class AuthService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  }

  // Profile Management
  async updateProfile(profileData) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  // User Management
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // AI Agent Configuration Management
  async getAIAgents() {
    return this.request('/ai-agents');
  }

  async getAvailableAIAgents() {
    return this.request('/ai-agents/available');
  }

  async createAIAgent(agentData) {
    return this.request('/ai-agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  }

  async updateAIAgent(agentId, agentData) {
    return this.request(`/ai-agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    });
  }

  async deleteAIAgent(agentId) {
    return this.request(`/ai-agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  async testAIAgent(testData) {
    return this.request('/ai-agents/test', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }

  async setDefaultAIAgent(agentId) {
    return this.request(`/ai-agents/${agentId}/set-default`, {
      method: 'POST',
    });
  }

  // AWS Account Management
  async getAWSAccounts() {
    return this.request('/aws-accounts');
  }

  async createAWSAccount(accountData) {
    return this.request('/aws-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async updateAWSAccount(accountId, accountData) {
    return this.request(`/aws-accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });
  }

  async deleteAWSAccount(accountId) {
    return this.request(`/aws-accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  async testAWSAccountConnection(accountId) {
    return this.request(`/aws-accounts/${accountId}/test`, {
      method: 'POST',
    });
  }

  // Cost Explorer Methods
  async getCostTrends(accountId, startDate, endDate, granularity = 'DAILY') {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      granularity: granularity
    });
    return this.request(`/cost-explorer/accounts/${accountId}/trends?${params}`);
  }

  async getServiceBreakdown(accountId, startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.request(`/cost-explorer/accounts/${accountId}/services?${params}`);
  }

  async getCostByRegion(accountId, startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      group_by: 'REGION'
    });
    
    const response = await this.request(`/cost-explorer/accounts/${accountId}/detailed?${params}`);
    
    // Transform the response to match what the frontend expects
    return {
      ...response,
      regions: response.groups.map(group => ({
        region_name: group.key,
        amount: group.amount,
        percentage: group.percentage,
        unit: group.unit
      }))
    };
  }

  async getCostComparison(accountId, currentStart, currentEnd, previousStart, previousEnd) {
    const params = new URLSearchParams({
      current_start: currentStart,
      current_end: currentEnd,
      previous_start: previousStart,
      previous_end: previousEnd
    });
    return this.request(`/cost-explorer/accounts/${accountId}/comparison?${params}`);
  }

  async getRightsizingRecommendations(accountId) {
    return this.request(`/cost-explorer/accounts/${accountId}/recommendations`);
  }

  async getDetailedCostData(accountId, startDate, endDate, groupBy = 'SERVICE', granularity = 'DAILY') {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy,
      granularity: granularity
    });
    return this.request(`/cost-explorer/accounts/${accountId}/detailed?${params}`);
  }

  async getMonthlyCostSummary(accountId, months = 6) {
    const params = new URLSearchParams({
      months: months.toString()
    });
    return this.request(`/cost-explorer/accounts/${accountId}/monthly-summary?${params}`);
  }

  async getCostStatistics(accountId, startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.request(`/cost-explorer/accounts/${accountId}/statistics?${params}`);
  }

  async getCostOptimizationInsights(accountId, startDate, endDate, agentId = null) {
    const requestData = {
      account_id: accountId,
      start_date: startDate,
      end_date: endDate,
      ...(agentId && { agent_id: agentId })
    };
    return this.request('/cost-explorer/ai-insights', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getCostForecast(accountId, startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.request(`/cost-explorer/accounts/${accountId}/forecast?${params}`);
  }

  async exportCostData(accountId, startDate, endDate, groupBy = 'SERVICE', format = 'csv') {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy,
      format: format
    });
    
    const url = `${API_BASE_URL}/cost-explorer/accounts/${accountId}/export?${params}`;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(url, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Generate filename based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'pdf' ? 'pdf' : format === 'json' ? 'json' : 'csv';
      const filename = `cost-report-${accountId}-${timestamp}.${extension}`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  // AI Reports Management
  async getAIReports(page = 1, pageSize = 20, awsAccountId = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    });
    
    if (awsAccountId) {
      params.append('aws_account_id', awsAccountId.toString());
    }
    
    return this.request(`/ai-reports?${params}`);
  }

  async getAIReportById(reportId) {
    return this.request(`/ai-reports/${reportId}`);
  }

  async exportAIReport(reportId, format = 'pdf') {
    const params = new URLSearchParams({
      format: format
    });
    
    const url = `${API_BASE_URL}/ai-reports/${reportId}/export?${params}`;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(url, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Generate filename based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'pdf' ? 'pdf' : 'json';
      const filename = `ai-report-${reportId}-${timestamp}.${extension}`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }
}

// Create and export a single instance
export const authService = new AuthService();
