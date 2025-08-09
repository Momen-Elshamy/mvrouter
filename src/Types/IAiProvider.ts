export default interface IAiProvider {
    _id?: string;
    name: string;
    path_to_api: string;
    icon: string;
    version: string;
    type: string;
    slug: string;
    description: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }
  