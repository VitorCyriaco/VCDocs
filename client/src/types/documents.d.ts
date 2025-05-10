export type UserNestedProps = {
    id: string;
    name: string;
} | null;

export type DepartmentNestedProps = {
    id: number;
    name: string;
}

export type CategoryNestedProps = {
    id: number;
    name: string;
    department: DepartmentNestedProps;
}

export type DocumentVersionProps = {
    id: string;
    version: number;
    filePath: string;
    createdAt: string;
    documentId: string;
}

export type DocumentsProps = {
    id: string;
    title: string;
    description: string | null;

    status: string;
    createdAt: string;

    uploadedBy: UserNestedProps;
    approvedBy: UserNestedProps | null;
    categories: CategoryNestedProps[];
    restrictedToDepartments: DepartmentNestedProps[];
}


export type DocumentDetailsProps = {
    id: string;
    title: string;
    filePath: string;
    description: string | null;
    status: string;
    createdAt: string;
    companyId: string;

    uploadedBy: UserNestedProps;
    approvedBy: UserNestedProps | null;
    company: { id: string; name: string; };
    categories: CategoryNestedProps[];
    restrictedToDepartments: DepartmentNestedProps[];
    versions: DocumentVersionProps[];

    views?: DocumentViewProps[];
}
export type DocumentUploadModalProps = {
    isOpen: boolean;
    onClose: () => void;
}