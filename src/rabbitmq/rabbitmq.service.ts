import { Injectable, Logger } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';

@Injectable()
export class RabbitMQService {
  protected readonly client = new ClientRMQ({
    urls: [process.env.RABBITMQ_HOST],
    queue: 'deliveries',
    noAck: false,
    queueOptions: {
      durable: true,
    },
  });

  logger = new Logger();

  async clientEmit(eventName: string, payload: any): Promise<void> {
    this.logger.log(eventName, 'Publish Event');
    await this.client.send(eventName, payload).subscribe();
  }
}
