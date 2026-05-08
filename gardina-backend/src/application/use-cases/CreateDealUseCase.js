import { Deal } from '../../domain/aggregates/Deal.js';
import AuditLogService from '../services/AuditLogService.js';

/**
 * CreateDealUseCase
 * Application service for creating a new deal
 */
export class CreateDealUseCase {
  constructor(dealRepository, clientRepository, userRepository) {
    this.dealRepository = dealRepository;
    this.clientRepository = clientRepository;
    this.userRepository = userRepository;
  }

  async execute(dealData, currentUser) {
    const { clientId, designerId } = dealData;

    // Validate client exists
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    // Validate designer exists
    const designerExists = await this.userRepository.exists(designerId);
    if (!designerExists) {
      throw new Error(`Designer with ID ${designerId} not found`);
    }

    // Create deal using factory method
    const deal = Deal.create(dealData);

    // Save deal
    const savedDeal = await this.dealRepository.save(deal);
    
    // Log the action (currentUser may be absent when called from legacy controllers)
    if (currentUser?.id) {
      await AuditLogService.log({
        userId: currentUser.id,
        userName: currentUser.name,
        actionType: 'DEAL_CREATED',
        entityType: 'Deal',
        entityId: savedDeal.id,
        entityName: `Сделка для клиента ${client.name}`,
        changes: {
          new: typeof savedDeal.toPrimitives === 'function'
            ? savedDeal.toPrimitives()
            : savedDeal,
        },
      });
    }

    // Publish domain events (would be handled by event bus)
    // eventBus.publish(deal.domainEvents);

    return {
      id: savedDeal.id,
      clientId: savedDeal.clientId,
      designerId: savedDeal.designerId,
      status: savedDeal.status,
      createdAt: savedDeal.createdAt,
    };
  }
}
