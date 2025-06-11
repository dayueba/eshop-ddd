import mongoose from 'mongoose';
import { environment } from './environment';

class DatabaseConnection {
  private isConnected = false;

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('数据库已连接');
      return;
    }

    try {
      await mongoose.connect(environment.mongoUrl, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      console.log('✅ 数据库连接成功');

      // 监听连接事件
      mongoose.connection.on('error', (error) => {
        console.error('❌ 数据库连接错误:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ 数据库连接断开');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 数据库重新连接');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ 数据库连接已关闭');
    } catch (error) {
      console.error('❌ 关闭数据库连接时出错:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async waitForConnection(): Promise<void> {
    const maxAttempts = 10;
    let attempts = 0;

    while (!this.isConnected && attempts < maxAttempts) {
      console.log(`🔄 等待数据库连接... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!this.isConnected) {
      throw new Error('数据库连接超时');
    }
  }
}

export const databaseConnection = new DatabaseConnection(); 