import {
  type ActorMetadata,
  FieldMetadataType,
} from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type FieldTypeAndNameMetadata } from 'src/engine/workspace-manager/utils/get-ts-vector-column-expression.util';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

const PHONE_NUMBER_FIELD_NAME = 'phoneNumber';
const MESSAGE_BODY_FIELD_NAME = 'messageBody';

export const SEARCH_FIELDS_FOR_WHATSAPP_MESSAGES: FieldTypeAndNameMetadata[] = [
  { name: PHONE_NUMBER_FIELD_NAME, type: FieldMetadataType.PHONES },
  { name: MESSAGE_BODY_FIELD_NAME, type: FieldMetadataType.TEXT },
];

export class WhatsappMessageWorkspaceEntity extends BaseWorkspaceEntity {
  phoneNumber: string;
  messageBody: string;
  status: string;
  direction: string;
  externalId: string | null;
  scheduledAt: Date | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  person: EntityRelation<PersonWorkspaceEntity>;
  workspaceMember: EntityRelation<WorkspaceMemberWorkspaceEntity>;
}
